const supabase = require('../config/supabase');

// Single source of truth for tier thresholds (used by rankings API and record adjudication).
const tierFor = (points) => {
  if (points >= 50000) return 'Grand Champion';
  if (points >= 20000) return 'Elite Master';
  if (points >= 5000) return 'Pro Competitor';
  return 'Challenger';
};

const toInt = (v, fallback = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
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
  return saved;
};

// Points configured in the points_rules table (admin editable), with sane defaults.
const DEFAULT_RULE_POINTS = { verified_record: 100, world_record: 250 };
const rulePoints = async (ruleName) => {
  const { data } = await supabase.from('points_rules').select('points_value, active').eq('rule_name', ruleName).maybeSingle();
  if (data && data.active !== false) return toInt(data.points_value);
  return DEFAULT_RULE_POINTS[ruleName] || 0;
};

// Points for a newly verified record when the admin didn't type an explicit amount.
const pointsForVerifiedRecord = async (record) => {
  let pts = await rulePoints('verified_record');
  if (record.record_type === 'world_record') pts += await rulePoints('world_record');
  return pts;
};

module.exports = { tierFor, awardPoints, toInt, rulePoints, pointsForVerifiedRecord };
