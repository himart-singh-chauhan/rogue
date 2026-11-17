// Monthly submission allowance and extra submission packs.
//
// Each plan includes a number of submissions per calendar month (membership_plans.submission_limit,
// null = unlimited; members without a paid plan get the Free plan's number). Submissions and challenges
// both count. When the month's submissions are used, each further submission uses one extra submission
// from a pack (users.extra_submissions). Packs are bought through Stripe; credits never expire.
// The per-record submission fee (Admin → System Settings → Fees) is separate and unchanged.
const supabase = require('../config/supabase');
const { notifyMember, siteUrl } = require('../utils/notify');

const DEFAULT_PACKS = [
  { count: 1, price: 4.99 },
  { count: 5, price: 14.99, popular: true },
  { count: 10, price: 24.99 },
];
const money = (n) => Math.round(Number(n) * 100) / 100;

const getPacks = async () => {
  const { data } = await supabase.from('system_settings').select('value').eq('key', 'submission_packs').maybeSingle();
  let packs = DEFAULT_PACKS;
  try { const v = typeof data?.value === 'string' ? JSON.parse(data.value) : data?.value; if (Array.isArray(v) && v.length) packs = v; } catch { /* defaults */ }
  return packs
    .map((p) => ({ count: parseInt(p.count, 10), price: money(p.price), popular: !!p.popular }))
    .filter((p) => p.count > 0 && p.count <= 1000 && p.price >= 0.5 && p.price <= 10000)
    .slice(0, 6);
};

const monthStart = () => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); };
const nextMonthStart = () => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)); };

/** { limit (null = unlimited), used, remaining, extra, planName, resetsOn } for a member */
const allowanceFor = async (user) => {
  const userId = user.id;
  const [{ data: membership }, { count: used }, { data: credits }] = await Promise.all([
    supabase.from('memberships').select('tier').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('records').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', monthStart().toISOString()),
    supabase.from('users').select('extra_submissions').eq('id', userId).maybeSingle().then((r) => (r.error ? { data: null } : r)),
  ]);
  const slug = membership?.tier || 'free';
  let { data: plan } = await supabase.from('membership_plans').select('name, submission_limit').eq('slug', slug).maybeSingle();
  if (!plan) ({ data: plan } = await supabase.from('membership_plans').select('name, submission_limit').eq('slug', 'free').maybeSingle());
  const unlimited = user.is_admin || plan?.submission_limit === null || plan?.submission_limit === undefined && !!membership;
  const limit = unlimited ? null : Number(plan?.submission_limit ?? 3);
  const usedN = used || 0;
  return {
    planName: plan?.name || 'Free',
    limit,
    used: usedN,
    remaining: limit === null ? null : Math.max(0, limit - usedN),
    extra: Number(credits?.extra_submissions || 0),
    resetsOn: nextMonthStart().toISOString().slice(0, 10),
  };
};

const limitMessage = (a) => `You have used all ${a.limit} submissions included in your ${a.planName} plan this month. Get an extra submission pack or upgrade your plan on the Membership page to submit more.`;

/**
 * Called just before a record is created. Returns { ok: true, usedCredit } or { ok: false, status, body }.
 * Uses one extra submission when the plan's month is used up.
 */
const reserveSubmission = async (user) => {
  let a;
  try { a = await allowanceFor(user); } catch (e) { console.warn('[packs] allowance check skipped:', e.message); return { ok: true, usedCredit: false }; }
  if (a.limit === null || a.used < a.limit) return { ok: true, usedCredit: false };
  if (a.extra > 0) {
    const { data: left, error } = await supabase.rpc('change_extra_submissions', { p_user: user.id, p_change: -1 });
    if (!error && left !== null && left !== undefined) return { ok: true, usedCredit: true };
  }
  return { ok: false, status: 402, body: { code: 'submission_limit', message: limitMessage(a), allowance: a } };
};
const logCreditUse = async (userId, recordId) => {
  await supabase.from('submission_credit_events').insert({ user_id: userId, change: -1, reason: 'used', reference_id: recordId }).then(() => {}, () => {});
};
const giveBackCredit = async (userId) => {
  await supabase.rpc('change_extra_submissions', { p_user: userId, p_change: 1 }).then(() => {}, () => {});
};

// ---------------- API ----------------
// GET /api/submissions/packs  (public)
const listPacks = async (req, res) => res.json({ packs: await getPacks() });

// GET /api/submissions/allowance
const myAllowance = async (req, res) => {
  try { res.json({ ...(await allowanceFor(req.user)), packs: await getPacks() }); }
  catch (e) { res.status(500).json({ message: 'Could not load your submissions', error: e.message }); }
};

// POST /api/submissions/packs/checkout { count } → Stripe page
const buyPack = async (req, res) => {
  const stripe = require('../utils/stripe');
  if (!stripe.stripeEnabled()) return res.status(503).json({ message: 'Card payments are not switched on yet.' });
  const packs = await getPacks();
  const pack = packs.find((p) => p.count === parseInt(req.body?.count, 10));
  if (!pack) return res.status(400).json({ message: 'Choose one of the submission packs.' });
  try {
    const customerId = await stripe.ensureCustomer(req.user.id).catch(() => null);
    const label = `${pack.count} extra submission${pack.count === 1 ? '' : 's'}`;
    const result = await stripe.createCheckout({
      req, kind: 'pack', referenceId: req.user.id, userId: req.user.id, email: req.user.email, customerId,
      lines: [{ name: `AMPEX ${label}`, description: 'Used after your plan’s monthly submissions; they never expire.', amount: pack.price, qty: 1 }],
      mode: 'payment', successPath: '/elite', cancelPath: '/elite',
      metadata: { pack_count: pack.count }, description: label,
    });
    res.status(201).json({ checkoutUrl: result.url, paymentId: result.paymentId });
  } catch (e) {
    res.status(502).json({ message: 'The payment page could not be opened. Please try again.', error: e.message });
  }
};

// Stripe → packs (see utils/stripe.js)
const packCount = (payment) => parseInt(payment?.metadata?.pack_count, 10) || 0;
const paymentHooks = {
  onPaid: async (payment) => {
    const count = packCount(payment);
    if (!count || !payment.user_id) return;
    // the unique index makes this exactly-once even if Stripe sends the event twice
    const { error } = await supabase.from('submission_credit_events').insert({ user_id: payment.user_id, change: count, reason: 'purchase', reference_id: payment.id });
    if (error) { if (error.code === '23505') return; throw error; }
    const { error: e2 } = await supabase.rpc('change_extra_submissions', { p_user: payment.user_id, p_change: count });
    if (e2) throw e2;
    await notifyMember({
      userId: payment.user_id,
      subject: `${count} extra submission${count === 1 ? '' : 's'} added`,
      body: `Thank you! ${count} extra submission${count === 1 ? ' is' : 's are'} now on your account. They are used after your plan's monthly submissions and never expire.\n\nSubmit a record: ${siteUrl()}/verify`,
    });
  },
  onFailed: async () => {},
  onRefund: async (payment, { full } = {}) => {
    const count = packCount(payment);
    if (!full || !count || !payment.user_id) return;
    const { data: u } = await supabase.from('users').select('extra_submissions').eq('id', payment.user_id).maybeSingle();
    const take = Math.min(count, Number(u?.extra_submissions || 0));
    if (take > 0) await supabase.rpc('change_extra_submissions', { p_user: payment.user_id, p_change: -take });
    await supabase.from('submission_credit_events').insert({ user_id: payment.user_id, change: -take, reason: 'refund', reference_id: payment.id, note: 'pack refunded' }).then(() => {}, () => {});
  },
};

// ---------------- admin ----------------
// GET / PUT /api/admin/submission-packs  { packs: [{count, price, popular}] }
const adminGetPacks = async (req, res) => res.json({ packs: await getPacks() });
const adminSavePacks = async (req, res) => {
  const raw = Array.isArray(req.body?.packs) ? req.body.packs : [];
  const packs = raw.map((p) => ({ count: parseInt(p.count, 10), price: money(p.price), popular: !!p.popular }))
    .filter((p) => p.count > 0 && p.count <= 1000 && p.price >= 0.5 && p.price <= 10000).slice(0, 6);
  if (!packs.length) return res.status(400).json({ message: 'Add at least one pack (number of submissions and a price of $0.50 or more).' });
  const { error } = await supabase.from('system_settings').upsert({ key: 'submission_packs', value: JSON.stringify(packs) }, { onConflict: 'key' });
  if (error) return res.status(500).json({ message: 'Could not save the packs', error: error.message });
  res.json({ packs, message: 'Submission packs saved.' });
};

// PUT /api/admin/members/:id/extra-submissions { extra }  (set a member's balance)
const adminSetCredits = async (req, res) => {
  const extra = parseInt(req.body?.extra, 10);
  if (!Number.isInteger(extra) || extra < 0 || extra > 100000) return res.status(400).json({ message: 'Enter a number of 0 or more.' });
  const { data: u } = await supabase.from('users').select('id, extra_submissions').eq('id', req.params.id).maybeSingle();
  if (!u) return res.status(404).json({ message: 'Member not found' });
  const { error } = await supabase.from('users').update({ extra_submissions: extra }).eq('id', u.id);
  if (error) return res.status(500).json({ message: 'Could not save', error: error.message });
  await supabase.from('submission_credit_events').insert({ user_id: u.id, change: extra - Number(u.extra_submissions || 0), reason: 'admin', created_by: req.user.id, note: `set to ${extra}` }).then(() => {}, () => {});
  res.json({ extra, message: `Extra submissions set to ${extra}.` });
};

// GET /api/admin/members/:id/allowance
const adminMemberAllowance = async (req, res) => {
  const { data: u } = await supabase.from('users').select('id, is_admin').eq('id', req.params.id).maybeSingle();
  if (!u) return res.status(404).json({ message: 'Member not found' });
  try { res.json(await allowanceFor(u)); } catch (e) { res.status(500).json({ message: 'Could not load', error: e.message }); }
};

module.exports = {
  DEFAULT_PACKS, getPacks, allowanceFor, reserveSubmission, logCreditUse, giveBackCredit,
  listPacks, myAllowance, buyPack, paymentHooks, adminGetPacks, adminSavePacks, adminSetCredits, adminMemberAllowance,
};
