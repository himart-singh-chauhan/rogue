const supabase = require('../config/supabase');

// Single source of truth for tier thresholds (used by rankings API and record adjudication).
// Points were rescaled in Nov 2026 (awards of 100 became 10), so thresholds are 1/10 of before.
const tierFor = (points) => {
  if (points >= 5000) return 'Grand Champion';
  if (points >= 2000) return 'Elite Master';
  if (points >= 500) return 'Pro Competitor';
  return 'Challenger';
};

const toInt = (v, fallback = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

// Recompute everyone's global_rank in one SQL statement (cheap; keeps profiles and leaderboards in sync).
const refreshGlobalRanks = async () => {
  const { error } = await supabase.rpc('recalculate_global_ranks');
  if (error) console.warn('[Rankings] rank refresh failed:', error.message);
};

/**
 * Add (or subtract) points for a user: writes a history row and upserts user_rankings.
 * counters: optional { verified_records_count: +1, world_records_count: +1 } deltas.
 */
const awardPoints = async ({ userId, points, source, referenceId = null, reason = null, adminId = null, isManual = false, adminNotes = null, counters = {} }) => {
  const delta = toInt(points);

  const { error: historyError } = await supabase.from('user_points_history').insert([{
    user_id: userId,
    points_awarded: delta,
    source: source || 'system',
    reference_id: referenceId ? String(referenceId) : null,
    reason,
    admin_notes: adminNotes,
    admin_id: adminId,
    is_manual: !!isManual,
  }]);
  if (historyError) throw historyError;

  const { data: current, error: currentError } = await supabase
    .from('user_rankings')
    .select('total_points, verified_records_count, world_records_count')
    .eq('user_id', userId)
    .maybeSingle();
  if (currentError) throw currentError;

  const total = Math.max(0, (current?.total_points || 0) + delta);
  const row = {
    user_id: userId,
    total_points: total,
    tier_badge: tierFor(total),
    verified_records_count: Math.max(0, (current?.verified_records_count || 0) + toInt(counters.verified_records_count)),
    world_records_count: Math.max(0, (current?.world_records_count || 0) + toInt(counters.world_records_count)),
    updated_at: new Date(),
  };

  const { data: saved, error: saveError } = await supabase
    .from('user_rankings')
    .upsert(row, { onConflict: 'user_id' })
    .select()
    .single();
  if (saveError) throw saveError;

  await refreshGlobalRanks();
  return saved;
};

// Points configured in the points_rules table (admin editable), with sane defaults.
const DEFAULT_RULE_POINTS = { verified_record: 10, world_record: 25 };
const rulePoints = async (ruleName) => {
  const { data } = await supabase.from('points_rules').select('points_value, active').eq('rule_name', ruleName).maybeSingle();
  if (data && data.active !== false) return toInt(data.points_value);
  return DEFAULT_RULE_POINTS[ruleName] || 0;
};

// Points for a newly verified record when the admin didn't type an explicit amount.
// (An extra bonus applies only when the admin explicitly flags the record as a world record.)
const pointsForVerifiedRecord = async (record) => {
  let pts = await rulePoints('verified_record');
  if (record.record_type === 'world_record') pts += await rulePoints('world_record');
  return pts;
};

// Every verified record is an official world record (as the AMPEX certificate states),
// so verifying a record counts towards both "Verified" and "W.R." on the leaderboards.
const VERIFIED_RECORD_COUNTERS = { verified_records_count: 1, world_records_count: 1 };
const UNVERIFIED_RECORD_COUNTERS = { verified_records_count: -1, world_records_count: -1 };

// Does this record currently hold its "verified" award? Read from the record's own points history,
// so it stays right however many times a record is approved, rejected and approved again.
const recordAwardState = async (recordId) => {
  const { data, error } = await supabase
    .from('user_points_history')
    .select('points_awarded, source')
    .eq('reference_id', String(recordId))
    .in('source', ['record_verified', 'record_unverified']);
  if (error) throw error;
  const rows = data || [];
  const awards = rows.filter((r) => r.source === 'record_verified').length;
  const reversals = rows.filter((r) => r.source === 'record_unverified').length;
  return { held: awards > reversals, net: rows.reduce((sum, r) => sum + toInt(r.points_awarded), 0) };
};

/**
 * Keep a record's points, leaderboard counters and certificate in step with its verified status.
 * Call it after every status change from any admin screen. It awards once on verification and
 * takes the points back (and revokes the certificate) if the record stops being verified.
 */
// A challenge that is approved beats the record it challenged; un-approving it restores that record.
const syncBeatenRecord = async (recordId, verified) => {
  try {
    const { data: rec } = await supabase.from('records').select('id, challenged_record_id').eq('id', recordId).maybeSingle();
    if (!rec?.challenged_record_id) return;
    if (verified) {
      await supabase.from('records').update({ beaten_by_record_id: rec.id, beaten_at: new Date(), updated_at: new Date() }).eq('id', rec.challenged_record_id);
    } else {
      await supabase.from('records').update({ beaten_by_record_id: null, beaten_at: null, updated_at: new Date() }).eq('id', rec.challenged_record_id).eq('beaten_by_record_id', rec.id);
    }
  } catch (e) {
    console.warn('[Records] beaten status not updated:', e.message);
  }
};

const syncRecordAward = async (record, { verified, points = 0, adminId = null } = {}) => {
  if (record?.id) await syncBeatenRecord(record.id, verified);
  if (!record?.id || !record.user_id) return null;
  const { held, net } = await recordAwardState(record.id);

  if (verified && !held) {
    const pts = toInt(points) > 0 ? toInt(points) : await pointsForVerifiedRecord(record);
    // Rewards program: a referred member's first verified record qualifies their referral
    require('./rewards').onMemberVerified(record.user_id);
    return awardPoints({
      userId: record.user_id, points: pts, source: 'record_verified', referenceId: record.id,
      reason: `Record verified: ${record.title || ''}`.trim(), adminId, counters: VERIFIED_RECORD_COUNTERS,
    });
  }

  if (!verified && held) {
    await supabase
      .from('certificate_issuances')
      .update({ status: 'revoked', revoked_at: new Date(), revoke_reason: 'The record is no longer verified' })
      .eq('record_id', record.id)
      .eq('status', 'issued');
    return awardPoints({
      userId: record.user_id, points: -Math.max(0, net), source: 'record_unverified', referenceId: record.id,
      reason: `Record no longer verified: ${record.title || ''}`.trim(), adminId, counters: UNVERIFIED_RECORD_COUNTERS,
    });
  }
  return null;
};

module.exports = { tierFor, awardPoints, toInt, rulePoints, pointsForVerifiedRecord, refreshGlobalRanks, syncRecordAward, VERIFIED_RECORD_COUNTERS };
