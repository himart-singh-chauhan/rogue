// Automatic achievement awards: each catalog award can be linked to a criterion. When a member meets it,
// the award is given once (member_awards.auto) and appears on their profile. Awards are kept once earned.
//
// The stats are the same ones the public profile shows (authController.getPublicProfile):
// tier from points, first place / top 10 = rank inside each category by verified records,
// issued certificates, and the AMPEX Ambassador rewards level.
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { tierFor } = require('./rankings');
const rewards = require('./rewards');
const { notifyMember, siteUrl } = require('./notify');

const CRITERIA = {
  manual: { label: () => 'Given by an admin', test: () => false },
  grand_champion: { label: () => 'Reach the Grand Champion tier (5,000 points)', test: (s) => s.tier === 'Grand Champion' },
  elite_master: { label: () => 'Reach the Elite Master tier (2,000 points) or higher', test: (s) => s.tier === 'Elite Master' || s.tier === 'Grand Champion' },
  pro_competitor: { label: (v) => `At least ${v || 1} verified record or challenge`, test: (s, v) => s.verified >= (v || 1) },
  first_place: { label: (v) => (v > 1 ? `First place in at least ${v} categories` : 'First place in a category'), test: (s, v) => s.firstPlace >= (v || 1) },
  top_10: { label: (v) => `Global top 10 in at least ${v || 1} ${(v || 1) === 1 ? 'category' : 'categories'}`, test: (s, v) => s.top10 >= (v || 1) },
  certified: { label: (v) => `At least ${v || 1} official AMPEX certificate`, test: (s, v) => s.certificates >= (v || 1) },
  ambassador: { label: () => 'Reach the AMPEX Ambassador rewards level', test: (s) => s.ambassador },
};
const criteriaLabel = (criteria, value) => (CRITERIA[criteria] || CRITERIA.manual).label(value);

const all = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/** Stats for every member (one pass), or only the given ids. */
const computeStats = async (userIds = null, { needAmbassador = true } = {}) => {
  const only = (q) => (userIds ? q.in('user_id', userIds) : q);
  const [rankings, verified, certs] = await Promise.all([
    all(only(supabase.from('user_rankings').select('user_id, total_points, tier_badge'))),
    all(supabase.from('records').select('user_id, category').eq('status', 'verified').limit(100000)),
    all(only(supabase.from('certificate_issuances').select('user_id').eq('status', 'issued'))),
  ]);
  const stats = {};
  const get = (id) => (stats[id] ||= { tier: 'Challenger', points: 0, verified: 0, firstPlace: 0, top10: 0, certificates: 0, ambassador: false });
  (userIds || []).forEach(get);
  rankings.forEach((r) => { const s = get(r.user_id); s.points = r.total_points || 0; s.tier = r.tier_badge && r.tier_badge !== 'Challenger' ? r.tier_badge : tierFor(s.points); });

  // rank inside each category by number of verified records (ties share the place), like the profile
  const byCategory = {};
  verified.forEach((r) => {
    if (!r.user_id) return;
    const cat = String(r.category || 'Uncategorized').trim().toLowerCase();
    byCategory[cat] ||= {};
    byCategory[cat][r.user_id] = (byCategory[cat][r.user_id] || 0) + 1;
  });
  Object.values(byCategory).forEach((counts) => {
    const values = Object.values(counts);
    Object.entries(counts).forEach(([uid, mine]) => {
      if (userIds && !userIds.includes(uid)) return;
      const rank = values.filter((c) => c > mine).length + 1;
      const s = get(uid);
      s.verified += mine;
      if (rank === 1) s.firstPlace += 1;
      if (rank <= 10) s.top10 += 1;
    });
  });
  certs.forEach((c) => { if (c.user_id) get(c.user_id).certificates += 1; });

  if (needAmbassador) {
    try {
      const settings = await rewards.getSettings();
      const tx = await all(only(supabase.from('reward_transactions').select('user_id, points')));
      const net = {};
      tx.forEach((t) => { net[t.user_id] = (net[t.user_id] || 0) + (parseInt(t.points, 10) || 0); });
      Object.entries(net).forEach(([uid, pts]) => { if (rewards.levelInfo(Math.max(0, pts), settings).isAmbassador) get(uid).ambassador = true; });
    } catch { /* rewards program not set up: nobody is an ambassador */ }
  }
  return stats;
};

const newAwardNumber = () => `AWD-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

/**
 * Gives every published automatic award to the members who qualify and do not have it yet.
 * userId: only check that member (used when their profile is opened). Returns the new grants.
 */
const syncAutoAwards = async ({ userId = null, notify = true } = {}) => {
  const awards = await all(supabase.from('achievement_awards').select('id, title, criteria, criteria_value').eq('status', 'published').neq('criteria', 'manual'));
  if (!awards.length) return [];
  const ids = userId ? [userId] : null;
  const stats = await computeStats(ids, { needAmbassador: awards.some((a) => a.criteria === 'ambassador') });
  const memberIds = Object.keys(stats);
  if (!memberIds.length) return [];

  let have = supabase.from('member_awards').select('award_id, user_id').in('award_id', awards.map((a) => a.id));
  if (userId) have = have.eq('user_id', userId);
  const owned = new Set((await all(have)).map((r) => `${r.award_id}:${r.user_id}`));

  const due = [];
  for (const uid of memberIds) {
    for (const a of awards) {
      const rule = CRITERIA[a.criteria];
      if (rule && !owned.has(`${a.id}:${uid}`) && rule.test(stats[uid], a.criteria_value)) due.push({ award: a, userId: uid });
    }
  }
  if (!due.length) return [];

  const users = Object.fromEntries((await all(supabase.from('users').select('id, name, username, account_status').in('id', [...new Set(due.map((d) => d.userId))]))).map((u) => [u.id, u]));
  const granted = [];
  for (const d of due) {
    const u = users[d.userId];
    if (!u || (u.account_status && u.account_status === 'banned')) continue;
    const { error } = await supabase.from('member_awards').insert({
      award_id: d.award.id, user_id: u.id, award_number: newAwardNumber(), recipient_name: u.name, auto: true,
    });
    if (error) { if (error.code !== '23505') console.warn('[awards] auto grant failed:', error.message); continue; }
    granted.push({ awardId: d.award.id, title: d.award.title, userId: u.id, name: u.name });
    if (notify) {
      await notifyMember({
        userId: u.id,
        subject: `You earned the ${d.award.title}`,
        body: `Congratulations! You earned the ${d.award.title}.\n\nYou can see it and print it on your profile under Achievements: ${siteUrl()}/profile/${encodeURIComponent(u.username || '')}`,
      });
    }
  }
  return granted;
};

// For hooks (points, certificates): never lets an award problem break the action that triggered it
const syncQuietly = async (opts) => {
  try { return await syncAutoAwards(opts); } catch (e) {
    if (!/achievement_awards|member_awards|schema cache|does not exist/i.test(e.message || '')) console.warn('[awards] sync skipped:', e.message);
    return [];
  }
};

module.exports = { CRITERIA, criteriaLabel, computeStats, syncAutoAwards, syncQuietly, newAwardNumber };
