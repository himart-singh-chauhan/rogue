// Referral, Points & Rewards: member dashboard, cart quote and the admin "Rewards & Referrals" panel.
const supabase = require('../config/supabase');
const R = require('../utils/rewards');
const { siteUrl } = require('../utils/notify');

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
const int = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };

const TYPE_LABELS = {
  referral: 'Referral bonus', referral_reversal: 'Referral reversed', purchase: 'Purchase reward',
  purchase_reversal: 'Purchase reversed', manual: 'Adjustment by AMPEX', promotion: 'Promotion bonus', fraud_adjustment: 'Fraud adjustment',
};
const formatTx = (t) => ({ id: t.id, points: t.points, type: t.type, label: TYPE_LABELS[t.type] || t.type, reason: t.reason, referenceType: t.reference_type, referenceId: t.reference_id, createdAt: t.created_at, admin: t.admin?.name || null, member: t.member ? { id: t.member.id, name: t.member.name, email: t.member.email } : undefined });

// GET /api/rewards/me
const getMyRewards = async (req, res) => {
  try {
    const settings = await R.getSettings();
    const code = await R.ensureReferralCode(req.user.id);
    const [summary, { data: refs }, { data: txs }] = await Promise.all([
      R.summaryFor(req.user.id),
      supabase.from('referrals').select('id, status, points_awarded, created_at, qualified_at, referred:users!referrals_referred_id_fkey(name, username)').eq('referrer_id', req.user.id).order('created_at', { ascending: false }).limit(200),
      supabase.from('reward_transactions').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(200),
    ]);
    res.json({
      ...summary,
      levels: settings.levels,
      referralPoints: settings.referralPoints,
      referralQualifiesOn: settings.referralQualifiesOn,
      allowCouponStacking: settings.allowCouponStacking,
      promotion: R.promotionActive(settings.promotion) ? settings.promotion : null,
      referralCode: code,
      referralLink: code ? `${siteUrl()}/signup?ref=${code}` : null,
      referrals: (refs || []).map((r) => ({ id: r.id, status: r.status, points: r.points_awarded, createdAt: r.created_at, qualifiedAt: r.qualified_at, name: r.referred?.name || 'New member' })),
      successfulReferrals: (refs || []).filter((r) => r.status === 'qualified').length,
      purchaseRewards: (txs || []).filter((t) => t.type === 'purchase').reduce((s, t) => s + t.points, 0),
      transactions: (txs || []).map(formatTx),
    });
  } catch (e) {
    res.status(500).json({ message: 'Could not load your rewards', error: e.message });
  }
};

// POST /api/rewards/quote { items: [{ id, qty, type, eventId }] } — preview of the member's level discount
const quote = async (req, res) => {
  try {
    if (!req.user) return res.json({ percent: 0, amount: 0, level: null });
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 100) : [];
    const ids = [...new Set(items.map((i) => i.id).filter(isUUID))];
    const { data: products } = ids.length ? await supabase.from('products').select('id, price, category').in('id', ids) : { data: [] };
    const byId = Object.fromEntries((products || []).map((p) => [p.id, p]));
    const evIds = [...new Set(items.filter((i) => i.type === 'ticket' && isUUID(i.eventId)).map((i) => i.eventId))];
    const { data: evs } = evIds.length ? await supabase.from('events').select('id, ticket_price').in('id', evIds) : { data: [] };
    const evById = Object.fromEntries((evs || []).map((e) => [e.id, e]));
    const lines = items.map((i) => {
      const qty = Math.min(100, Math.max(1, int(i.qty ?? i.quantity, 1)));
      if (i.type === 'ticket') return { productId: null, category: 'Tickets', isTicket: true, unitPrice: Number(evById[i.eventId]?.ticket_price) || 0, qty };
      const p = byId[i.id];
      return p ? { productId: p.id, category: p.category, unitPrice: Number(p.price) || 0, qty } : null;
    }).filter(Boolean);
    const q = await R.quoteDiscount(req.user.id, lines);
    res.json({ percent: q.percent, amount: q.amount, level: q.level, eligibleSubtotal: q.eligibleSubtotal, allowCouponStacking: q.settings.allowCouponStacking });
  } catch (e) {
    res.status(500).json({ message: 'Could not work out your reward discount' });
  }
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
const getSettings = async (req, res) => {
  try { res.json(await R.getSettings({ fresh: true })); } catch (e) { res.status(500).json({ message: 'Could not load settings', error: e.message }); }
};

const updateSettings = async (req, res) => {
  try {
    const saved = await R.saveSettings(req.body || {}, req.user.id);
    await supabase.from('audit_logs').insert({ actor_id: req.user.id, action_type: 'update_reward_settings', metadata: saved });
    res.json(saved);
  } catch (e) {
    res.status(500).json({ message: 'Could not save settings', error: e.message });
  }
};

// GET /api/admin/rewards/members?search=
const listMembers = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().replace(/[,()%]/g, '');
    let query = supabase.from('users').select('id, name, email, username, member_number, referral_code').order('created_at', { ascending: false }).limit(50);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%,member_number.ilike.%${search}%,referral_code.ilike.%${search}%`);
    const { data: users, error } = await query;
    if (error) throw error;
    const ids = (users || []).map((u) => u.id);
    const [{ data: txs }, { data: refs }] = await Promise.all([
      ids.length ? supabase.from('reward_transactions').select('user_id, points').in('user_id', ids) : { data: [] },
      ids.length ? supabase.from('referrals').select('referrer_id, status').in('referrer_id', ids) : { data: [] },
    ]);
    const settings = await R.getSettings();
    const pts = {}; (txs || []).forEach((t) => { pts[t.user_id] = (pts[t.user_id] || 0) + t.points; });
    const refCount = {}; (refs || []).forEach((r) => { if (r.status === 'qualified') refCount[r.referrer_id] = (refCount[r.referrer_id] || 0) + 1; });
    res.json((users || []).map((u) => {
      const points = Math.max(0, pts[u.id] || 0);
      const info = R.levelInfo(points, settings);
      return { id: u.id, name: u.name, email: u.email, username: u.username, memberNumber: u.member_number, referralCode: u.referral_code, points, level: info.level, discountPercent: info.discountPercent, isAmbassador: info.isAmbassador, referrals: refCount[u.id] || 0 };
    }));
  } catch (e) {
    res.status(500).json({ message: 'Could not load members', error: e.message });
  }
};

// POST /api/admin/rewards/adjust { userId, points, reason }
const adjust = async (req, res) => {
  const { userId, reason } = req.body || {};
  const points = int(req.body?.points);
  if (!isUUID(userId)) return res.status(400).json({ message: 'Choose a member' });
  if (!points) return res.status(400).json({ message: 'Enter the number of points to add (or a negative number to remove)' });
  if (!String(reason || '').trim()) return res.status(400).json({ message: 'A reason is required for every adjustment' });
  try {
    const type = req.body.type === 'fraud_adjustment' ? 'fraud_adjustment' : req.body.type === 'promotion' ? 'promotion' : 'manual';
    const tx = await R.addTransaction({ user_id: userId, points, type, reason: String(reason).trim().slice(0, 500), admin_id: req.user.id });
    res.status(201).json({ transaction: formatTx(tx), summary: await R.summaryFor(userId) });
  } catch (e) {
    res.status(500).json({ message: 'Could not save the adjustment', error: e.message });
  }
};

// GET /api/admin/rewards/transactions?userId=&type=
const listTransactions = async (req, res) => {
  try {
    let query = supabase.from('reward_transactions').select('*, member:users!reward_transactions_user_id_fkey(id, name, email), admin:users!reward_transactions_admin_id_fkey(name)').order('created_at', { ascending: false }).limit(300);
    if (isUUID(req.query.userId)) query = query.eq('user_id', req.query.userId);
    if (req.query.type) query = query.eq('type', String(req.query.type));
    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map(formatTx));
  } catch (e) {
    res.status(500).json({ message: 'Could not load transactions', error: e.message });
  }
};

// GET /api/admin/rewards/referrals?status=
const listReferrals = async (req, res) => {
  try {
    let query = supabase.from('referrals')
      .select('*, referrer:users!referrals_referrer_id_fkey(id, name, email), referred:users!referrals_referred_id_fkey(id, name, email, created_at)')
      .order('created_at', { ascending: false }).limit(300);
    if (req.query.status && req.query.status !== 'all') query = query.eq('status', String(req.query.status));
    const { data, error } = await query;
    if (error) throw error;
    res.json((data || []).map((r) => ({ id: r.id, status: r.status, points: r.points_awarded, note: r.note, code: r.code, createdAt: r.created_at, qualifiedAt: r.qualified_at, referrer: r.referrer, referred: r.referred })));
  } catch (e) {
    res.status(500).json({ message: 'Could not load referrals', error: e.message });
  }
};

// PUT /api/admin/rewards/referrals/:id { action: 'approve' | 'reject', note }
const decideReferral = async (req, res) => {
  try {
    const { data: ref } = await supabase.from('referrals').select('*').eq('id', req.params.id).maybeSingle();
    if (!ref) return res.status(404).json({ message: 'Referral not found' });
    if (req.body.action === 'approve') {
      if (ref.status === 'rejected') await supabase.from('referrals').update({ status: 'pending' }).eq('id', ref.id);
      await R.qualifyReferral({ ...ref, status: 'pending' }, req.user.id);
    } else if (req.body.action === 'reject') {
      await R.rejectReferral(ref, req.user.id, String(req.body.note || '').slice(0, 300));
    } else {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }
    const { data: updated } = await supabase.from('referrals').select('*').eq('id', ref.id).maybeSingle();
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: 'Could not update the referral', error: e.message });
  }
};

// GET /api/admin/rewards/report
const report = async (req, res) => {
  try {
    const settings = await R.getSettings();
    const [{ data: txs }, { data: refs }] = await Promise.all([
      supabase.from('reward_transactions').select('user_id, points, type'),
      supabase.from('referrals').select('status, referrer_id'),
    ]);
    const byUser = {};
    const byType = {};
    (txs || []).forEach((t) => { byUser[t.user_id] = (byUser[t.user_id] || 0) + t.points; byType[t.type] = (byType[t.type] || 0) + t.points; });
    const levelCounts = Object.fromEntries(settings.levels.map((l) => [l.name, 0]));
    Object.values(byUser).forEach((p) => { levelCounts[R.levelInfo(Math.max(0, p), settings).level] += 1; });
    const refStatus = { pending: 0, qualified: 0, flagged: 0, rejected: 0 };
    const topReferrers = {};
    (refs || []).forEach((r) => { refStatus[r.status] = (refStatus[r.status] || 0) + 1; if (r.status === 'qualified') topReferrers[r.referrer_id] = (topReferrers[r.referrer_id] || 0) + 1; });
    const topIds = Object.entries(topReferrers).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const { data: topUsers } = topIds.length ? await supabase.from('users').select('id, name').in('id', topIds.map(([id]) => id)) : { data: [] };
    const names = Object.fromEntries((topUsers || []).map((u) => [u.id, u.name]));
    res.json({
      enabled: settings.enabled,
      membersWithPoints: Object.keys(byUser).length,
      pointsOutstanding: Object.values(byUser).reduce((s, p) => s + Math.max(0, p), 0),
      pointsByType: byType,
      levelCounts,
      referrals: refStatus,
      topReferrers: topIds.map(([id, n]) => ({ id, name: names[id] || 'Member', referrals: n })),
    });
  } catch (e) {
    res.status(500).json({ message: 'Could not load the report', error: e.message });
  }
};

module.exports = { getMyRewards, quote, getSettings, updateSettings, listMembers, adjust, listTransactions, listReferrals, decideReferral, report };
