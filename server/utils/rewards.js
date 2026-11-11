// AMPEX Referral, Points & Rewards program.
// Reward points are a separate currency from competition ranking points (utils/rankings.js):
// they come from referrals, purchases and admin adjustments, and unlock shop discounts.
// Every change is a row in reward_transactions (append-only); balances are always sums of that ledger.
const crypto = require('crypto');
const supabase = require('../config/supabase');

const DEFAULT_SETTINGS = {
  enabled: true,
  referralPoints: 10,
  referralQualifiesOn: 'first_verified_record', // or 'signup'
  maxReferralsPerDay: 20,
  levels: [
    { name: 'Member', minPoints: 0, discountPercent: 0 },
    { name: 'Bronze Reward', minPoints: 100, discountPercent: 5 },
    { name: 'Silver Reward', minPoints: 250, discountPercent: 10 },
    { name: 'Gold Reward', minPoints: 500, discountPercent: 20 },
    { name: 'AMPEX Ambassador', minPoints: 1000, discountPercent: 40 },
  ],
  purchase: { pointsPerDollar: 1, categoryRates: {}, productPoints: {}, excludedCategories: ['Tickets'], excludedProductIds: [] },
  discount: { excludedCategories: ['Tickets'], excludedProductIds: [] },
  promotion: { active: false, multiplier: 2, startsAt: null, endsAt: null, label: '' },
  allowCouponStacking: false,
};

const int = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
const lc = (s) => String(s || '').trim().toLowerCase();

// Clean up settings coming from the database or the admin form (never trust shape)
const normalizeSettings = (raw = {}) => {
  const s = { ...DEFAULT_SETTINGS, ...(raw || {}) };
  const levels = (Array.isArray(s.levels) && s.levels.length ? s.levels : DEFAULT_SETTINGS.levels)
    .map((l) => ({ name: String(l.name || '').trim().slice(0, 60) || 'Level', minPoints: Math.max(0, int(l.minPoints)), discountPercent: Math.min(100, Math.max(0, num(l.discountPercent))) }))
    .sort((a, b) => a.minPoints - b.minPoints);
  if (levels[0].minPoints !== 0) levels.unshift({ name: 'Member', minPoints: 0, discountPercent: 0 });
  const p = { ...DEFAULT_SETTINGS.purchase, ...(s.purchase || {}) };
  const d = { ...DEFAULT_SETTINGS.discount, ...(s.discount || {}) };
  const promo = { ...DEFAULT_SETTINGS.promotion, ...(s.promotion || {}) };
  const rates = {};
  Object.entries(p.categoryRates || {}).forEach(([k, v]) => { if (k && Number.isFinite(Number(v))) rates[k] = Math.max(0, Number(v)); });
  const fixed = {};
  Object.entries(p.productPoints || {}).forEach(([k, v]) => { if (k && Number.isFinite(Number(v))) fixed[k] = Math.max(0, int(v)); });
  const list = (a) => (Array.isArray(a) ? [...new Set(a.map((x) => String(x).trim()).filter(Boolean))] : []);
  return {
    enabled: s.enabled !== false,
    referralPoints: Math.max(0, int(s.referralPoints, 10)),
    referralQualifiesOn: s.referralQualifiesOn === 'signup' ? 'signup' : 'first_verified_record',
    maxReferralsPerDay: Math.max(1, int(s.maxReferralsPerDay, 20)),
    levels,
    purchase: { pointsPerDollar: Math.max(0, num(p.pointsPerDollar, 1)), categoryRates: rates, productPoints: fixed, excludedCategories: list(p.excludedCategories), excludedProductIds: list(p.excludedProductIds) },
    discount: { excludedCategories: list(d.excludedCategories), excludedProductIds: list(d.excludedProductIds) },
    promotion: { active: !!promo.active, multiplier: Math.max(1, num(promo.multiplier, 1)), startsAt: promo.startsAt || null, endsAt: promo.endsAt || null, label: String(promo.label || '').slice(0, 80) },
    allowCouponStacking: !!s.allowCouponStacking,
  };
};

let cache = { at: 0, value: null };
const getSettings = async ({ fresh = false } = {}) => {
  if (!fresh && cache.value && Date.now() - cache.at < 30000) return cache.value;
  const { data } = await supabase.from('reward_settings').select('settings').eq('id', 1).maybeSingle();
  cache = { at: Date.now(), value: normalizeSettings(data?.settings) };
  return cache.value;
};
const saveSettings = async (raw, adminId) => {
  const settings = normalizeSettings(raw);
  const { error } = await supabase.from('reward_settings').upsert([{ id: 1, settings, updated_by: adminId, updated_at: new Date() }], { onConflict: 'id' });
  if (error) throw error;
  cache = { at: Date.now(), value: settings };
  return settings;
};

// Level from net qualifying points (milestones unlock automatically; points are not spent)
const levelInfo = (points, settings) => {
  const levels = settings.levels;
  let idx = 0;
  levels.forEach((l, i) => { if (points >= l.minPoints) idx = i; });
  const level = levels[idx];
  const next = levels[idx + 1] || null;
  const span = next ? next.minPoints - level.minPoints : 0;
  return {
    level: level.name,
    discountPercent: level.discountPercent,
    isTopLevel: !next,
    isAmbassador: !next && idx > 0,
    next: next ? { name: next.name, minPoints: next.minPoints, discountPercent: next.discountPercent, pointsToGo: Math.max(0, next.minPoints - points) } : null,
    progress: next ? Math.min(1, Math.max(0, (points - level.minPoints) / span)) : 1,
  };
};

const balanceFor = async (userId) => {
  const { data, error } = await supabase.from('reward_transactions').select('points').eq('user_id', userId);
  if (error) throw error;
  const rows = data || [];
  const net = rows.reduce((s, r) => s + int(r.points), 0);
  const earned = rows.reduce((s, r) => s + Math.max(0, int(r.points)), 0);
  return { points: Math.max(0, net), lifetimeEarned: earned };
};

// Insert a ledger row. Automatic awards are exactly-once (unique index): a repeat returns null.
const addTransaction = async (row) => {
  const { data, error } = await supabase.from('reward_transactions').insert([{ ...row, reference_id: row.reference_id != null ? String(row.reference_id) : null }]).select().maybeSingle();
  if (error) {
    if (error.code === '23505') return null;
    throw error;
  }
  return data;
};

// ---------------------------------------------------------------------------
// Referral codes and referrals
// ---------------------------------------------------------------------------
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from(crypto.randomBytes(8), (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');

const ensureReferralCode = async (userId) => {
  const { data: u } = await supabase.from('users').select('referral_code').eq('id', userId).maybeSingle();
  if (u?.referral_code) return u.referral_code;
  for (let i = 0; i < 5; i += 1) {
    const code = newCode();
    const { error } = await supabase.from('users').update({ referral_code: code }).eq('id', userId).is('referral_code', null);
    if (!error) {
      const { data: again } = await supabase.from('users').select('referral_code').eq('id', userId).maybeSingle();
      if (again?.referral_code) return again.referral_code;
    }
  }
  return null;
};

const ipHash = (ip) => (ip ? crypto.createHash('sha256').update(`ampex-ref:${ip}`).digest('hex').slice(0, 32) : null);

/**
 * Called after a new account is created with ?ref=CODE. Never throws (sign-up must not fail).
 * Fraud checks: no self-referral, referrer must be an active account, a daily cap per referrer,
 * and repeated sign-ups from one network are held for an admin ("flagged").
 */
const recordReferralAtSignup = async ({ newUserId, newUserEmail, code, ip }) => {
  try {
    const clean = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    if (!clean || !newUserId) return null;
    const settings = await getSettings();
    if (!settings.enabled) return null;
    const { data: referrer } = await supabase.from('users').select('id, email, account_status').eq('referral_code', clean).maybeSingle();
    if (!referrer || referrer.id === newUserId) return null;
    if (lc(referrer.email) === lc(newUserEmail)) return null;
    if (['suspended', 'banned'].includes(referrer.account_status)) return null;

    const hash = ipHash(ip);
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [{ count: today }, { count: sameNet }] = await Promise.all([
      supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', referrer.id).gte('created_at', since),
      hash ? supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', referrer.id).eq('signup_ip_hash', hash) : Promise.resolve({ count: 0 }),
    ]);
    let status = 'pending';
    let note = null;
    if ((today || 0) >= settings.maxReferralsPerDay) { status = 'flagged'; note = 'Daily referral limit reached'; }
    else if ((sameNet || 0) >= 2) { status = 'flagged'; note = 'Several sign-ups from the same network'; }

    const { data: ref, error } = await supabase.from('referrals')
      .insert([{ referrer_id: referrer.id, referred_id: newUserId, code: clean, status, signup_ip_hash: hash, note }])
      .select().maybeSingle();
    if (error) return null; // already referred, or invalid
    await supabase.from('users').update({ referred_by: referrer.id }).eq('id', newUserId);
    if (status === 'pending' && settings.referralQualifiesOn === 'signup') await qualifyReferral(ref, null);
    return ref;
  } catch (e) {
    console.warn('[Rewards] referral not recorded:', e.message);
    return null;
  }
};

// Award the referrer (exactly once per referred member)
const qualifyReferral = async (ref, adminId) => {
  if (!ref || ref.status === 'qualified' || ref.status === 'rejected') return null;
  const settings = await getSettings();
  const points = settings.referralPoints;
  const tx = await addTransaction({
    user_id: ref.referrer_id, points, type: 'referral', reference_type: 'referral', reference_id: ref.id,
    reason: 'Referral: a member you invited joined and was verified', admin_id: adminId,
  });
  await supabase.from('referrals').update({ status: 'qualified', points_awarded: tx ? points : ref.points_awarded, qualified_at: new Date(), decided_by: adminId, updated_at: new Date() }).eq('id', ref.id);
  return tx;
};

// After a member's record is verified: their pending referral (if any) qualifies
const onMemberVerified = async (userId) => {
  try {
    const settings = await getSettings();
    if (!settings.enabled || settings.referralQualifiesOn !== 'first_verified_record') return;
    const { data: ref } = await supabase.from('referrals').select('*').eq('referred_id', userId).eq('status', 'pending').maybeSingle();
    if (ref) await qualifyReferral(ref, null);
  } catch (e) {
    console.warn('[Rewards] referral qualification failed:', e.message);
  }
};

const rejectReferral = async (ref, adminId, note) => {
  if (!ref) return;
  if (ref.status === 'qualified' && ref.points_awarded > 0) {
    await addTransaction({
      user_id: ref.referrer_id, points: -Math.abs(ref.points_awarded), type: 'referral_reversal', reference_type: 'referral', reference_id: ref.id,
      reason: note || 'Referral reversed by an administrator', admin_id: adminId,
    });
  }
  await supabase.from('referrals').update({ status: 'rejected', note: note || ref.note, decided_by: adminId, updated_at: new Date() }).eq('id', ref.id);
};

// ---------------------------------------------------------------------------
// Shop: reward discount and purchase points
// ---------------------------------------------------------------------------
const isExcluded = (rule, line) =>
  (line.productId && rule.excludedProductIds.includes(String(line.productId))) ||
  rule.excludedCategories.map(lc).includes(lc(line.category));

/**
 * lines: [{ productId, category, unitPrice, qty, isTicket }] priced by the server.
 * Returns the member's level discount on eligible lines.
 */
const quoteDiscount = async (userId, lines) => {
  const settings = await getSettings();
  if (!settings.enabled || !userId) return { percent: 0, amount: 0, level: null, eligibleSubtotal: 0, settings };
  const { points } = await balanceFor(userId);
  const info = levelInfo(points, settings);
  const eligible = lines.filter((l) => !(l.isTicket && settings.discount.excludedCategories.map(lc).includes('tickets')) && !isExcluded(settings.discount, l));
  const eligibleSubtotal = money(eligible.reduce((s, l) => s + l.unitPrice * l.qty, 0));
  const amount = money(eligibleSubtotal * (info.discountPercent / 100));
  return { percent: info.discountPercent, amount, level: info.level, eligibleSubtotal, points, settings };
};

const promotionActive = (promo) => {
  if (!promo.active) return false;
  const now = Date.now();
  if (promo.startsAt && new Date(promo.startsAt).getTime() > now) return false;
  if (promo.endsAt && new Date(promo.endsAt).getTime() < now) return false;
  return true;
};

// Points a paid order earns (on the amount actually paid, after discounts)
const purchasePointsFor = (lines, settings, paidRatio = 1) => {
  const p = settings.purchase;
  let pts = 0;
  lines.forEach((l) => {
    if (isExcluded(p, l) || (l.isTicket && p.excludedCategories.map(lc).includes('tickets'))) return;
    if (l.productId && p.productPoints[String(l.productId)] !== undefined) { pts += p.productPoints[String(l.productId)] * l.qty; return; }
    const rate = Object.entries(p.categoryRates).find(([k]) => lc(k) === lc(l.category));
    pts += l.unitPrice * l.qty * paidRatio * (rate ? rate[1] : p.pointsPerDollar);
  });
  if (promotionActive(settings.promotion)) pts *= settings.promotion.multiplier;
  return Math.floor(pts);
};

/**
 * Keep an order's purchase points in step with its status: awarded once when the order is paid,
 * reversed if it is refunded, failed or cancelled. Safe to call repeatedly (exactly-once ledger).
 */
const syncOrderRewards = async (orderId) => {
  try {
    const { data: order } = await supabase.from('orders').select('id, user_id, subtotal, total, payment_status, shipping_status').eq('id', orderId).maybeSingle();
    if (!order || !order.user_id) return;
    const settings = await getSettings();
    const { data: txs } = await supabase.from('reward_transactions').select('type, points').eq('reference_type', 'order').eq('reference_id', String(order.id)).eq('user_id', order.user_id);
    const awarded = (txs || []).find((t) => t.type === 'purchase');
    const reversed = (txs || []).some((t) => t.type === 'purchase_reversal');
    const qualifies = order.payment_status === 'paid' && order.shipping_status !== 'cancelled';

    if (qualifies && !awarded && settings.enabled) {
      const { data: items } = await supabase.from('order_items').select('product_id, product_name, price, quantity, product:products(category)').eq('order_id', order.id);
      const lines = (items || []).map((i) => ({
        productId: i.product_id, category: i.product?.category || (String(i.product_name || '').startsWith('Ticket:') ? 'Tickets' : ''),
        unitPrice: num(i.price), qty: int(i.quantity, 1), isTicket: !i.product_id && String(i.product_name || '').startsWith('Ticket:'),
      }));
      const ratio = num(order.subtotal) > 0 ? Math.max(0, num(order.total) / num(order.subtotal)) : 1;
      const points = purchasePointsFor(lines, settings, ratio);
      if (points > 0) {
        await addTransaction({ user_id: order.user_id, points, type: 'purchase', reference_type: 'order', reference_id: order.id, reason: `Shop order ${String(order.id).slice(0, 8).toUpperCase()}` });
      }
    } else if (!qualifies && awarded && !reversed && int(awarded.points) > 0) {
      await addTransaction({ user_id: order.user_id, points: -int(awarded.points), type: 'purchase_reversal', reference_type: 'order', reference_id: order.id, reason: `Order ${String(order.id).slice(0, 8).toUpperCase()} ${order.payment_status === 'paid' ? 'cancelled' : order.payment_status}` });
    }
  } catch (e) {
    console.warn('[Rewards] order sync failed:', e.message);
  }
};

const summaryFor = async (userId) => {
  const settings = await getSettings();
  const bal = await balanceFor(userId);
  return { ...bal, ...levelInfo(bal.points, settings), enabled: settings.enabled };
};

module.exports = {
  DEFAULT_SETTINGS, normalizeSettings, getSettings, saveSettings, levelInfo, balanceFor, addTransaction,
  ensureReferralCode, recordReferralAtSignup, qualifyReferral, onMemberVerified, rejectReferral,
  quoteDiscount, purchasePointsFor, syncOrderRewards, summaryFor, promotionActive,
};
