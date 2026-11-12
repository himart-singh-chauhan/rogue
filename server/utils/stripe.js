// Stripe: hosted Checkout, the `payments` ledger, and what happens when Stripe tells us a payment
// completed, failed or was refunded. Card details never touch this server: members pay on Stripe's
// own page and come back to the site.
//
// Each kind of purchase ('shop', 'membership', 'submission') provides hooks in its controller:
//   paymentHooks = { onPaid(payment, session), onFailed(payment), onRefund(payment, { full }) }
// They are looked up lazily (below) so controllers can require this file without a cycle.
const supabase = require('../config/supabase');
const { siteUrl } = require('./notify');

// Objects fetched through the API always come back in this version's shape, whatever version the
// webhook endpoint in the Stripe dashboard uses. Webhooks are therefore only used as a "something
// changed" signal and the object is re-read from the API.
const API_VERSION = '2025-02-24.acacia';

const secretKey = () => String(process.env.STRIPE_SECRET_KEY || '').trim();
const stripeEnabled = () => /^(sk|rk)_(test|live)_/.test(secretKey());
const stripeMode = () => (stripeEnabled() ? (secretKey().includes('_live_') ? 'live' : 'test') : 'off');

let client = null;
const getStripe = () => {
  if (!stripeEnabled()) {
    const err = new Error('Online card payments are not available right now. Please try again later.');
    err.status = 503;
    throw err;
  }
  if (!client) {
    client = require('stripe')(secretKey(), { apiVersion: API_VERSION, maxNetworkRetries: 2, appInfo: { name: 'AMPEX World Records' } });
  }
  return client;
};

const cents = (n) => Math.round((Number(n) || 0) * 100);
const dollars = (c) => Math.round(Number(c) || 0) / 100;
const hookKinds = () => ({
  shop: require('../controllers/shopController').paymentHooks,
  membership: require('../controllers/membershipController').paymentHooks,
  submission: require('../controllers/recordController').paymentHooks,
});

// Where Stripe sends the buyer back: the site they came from (if it is one of ours), else the main site.
const hostOf = (u) => { try { return new URL(u).host.toLowerCase(); } catch { return ''; } };
const ourHosts = () => [
  ...String(process.env.CLIENT_URLS || '').split(',').map((o) => o.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')),
  hostOf(siteUrl()),
].filter(Boolean);
const returnBase = (req) => {
  const origin = String((req && req.get && req.get('origin')) || '').replace(/\/+$/, '');
  if (origin && (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || ourHosts().includes(hostOf(origin)))) return origin;
  return siteUrl();
};

const stringMeta = (obj) => Object.fromEntries(
  Object.entries(obj || {}).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v).slice(0, 490)])
);

/** A Stripe customer for this member (needed for subscriptions and "Manage billing"). */
const ensureCustomer = async (userId) => {
  const stripe = getStripe();
  const { data: u } = await supabase.from('users').select('id, name, email, stripe_customer_id').eq('id', userId).maybeSingle();
  if (!u) throw new Error('User not found');
  if (u.stripe_customer_id) {
    try {
      const c = await stripe.customers.retrieve(u.stripe_customer_id);
      if (c && !c.deleted) return c.id;
    } catch (e) {
      if (e.code !== 'resource_missing') throw e; // e.g. a test-mode customer after switching to live keys
    }
  }
  const c = await stripe.customers.create({ email: u.email, name: u.name || undefined, metadata: { user_id: u.id } });
  await supabase.from('users').update({ stripe_customer_id: c.id }).eq('id', u.id);
  return c.id;
};

/**
 * Start a Stripe Checkout and record it in `payments`.
 *  lines:  [{ name, description?, amount (dollars, per unit), qty, recurring?: 'month' | 'year' }]
 *  discountAmount: money off the whole purchase (already checked by our coupon / rewards rules)
 *  successPath / cancelPath: site paths to return to (session_id / payment are appended)
 */
const createCheckout = async ({
  req, kind, referenceId, userId = null, email = null, customerId = null, lines, mode = 'payment',
  successPath, cancelPath, metadata = {}, discountAmount = 0, discountName = null, description = null,
}) => {
  const stripe = getStripe();
  const subtotalCents = lines.reduce((s, l) => s + cents(l.amount) * l.qty, 0);
  const discountCents = Math.min(cents(discountAmount), subtotalCents);
  const totalCents = subtotalCents - discountCents;
  if (totalCents < 50) {
    const err = new Error('Card payments must be at least $0.50.');
    err.status = 400;
    throw err;
  }

  const { data: payment, error } = await supabase
    .from('payments')
    .insert([{ user_id: userId, kind, reference_id: String(referenceId), amount: dollars(totalCents), description, metadata, stripe_customer_id: customerId }])
    .select()
    .single();
  if (error) throw error;

  const base = returnBase(req);
  const sep = (p) => (p.includes('?') ? '&' : '?');
  const meta = stringMeta({ payment_id: payment.id, kind, reference_id: referenceId, user_id: userId });

  // One-off payments with a discount are charged as a single line (the discount is already applied),
  // so Stripe never needs its own coupon objects. Subscriptions need a Stripe coupon for "first payment off".
  let lineItems = lines;
  if (mode === 'payment' && discountCents > 0) {
    lineItems = [{
      name: description || 'AMPEX World Records purchase',
      description: `${lines.map((l) => `${l.qty} × ${l.name}`).join(', ')}${discountName ? ` (${discountName} applied)` : ''}`,
      amount: dollars(totalCents),
      qty: 1,
    }];
  }

  const params = {
    mode,
    client_reference_id: payment.id,
    metadata: meta,
    line_items: lineItems.map((l) => ({
      quantity: l.qty,
      price_data: {
        currency: 'usd',
        unit_amount: cents(l.amount),
        product_data: { name: String(l.name).slice(0, 250), ...(l.description ? { description: String(l.description).slice(0, 500) } : {}) },
        ...(l.recurring ? { recurring: { interval: l.recurring } } : {}),
      },
    })),
    success_url: `${base}${successPath}${sep(successPath)}payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}${cancelPath}${sep(cancelPath)}payment=cancelled&ref=${payment.id}`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // unpaid checkouts close after an hour
  };
  if (customerId) params.customer = customerId;
  else if (email) params.customer_email = email;
  if (mode === 'payment') params.payment_intent_data = { metadata: meta, ...(description ? { description } : {}) };
  if (mode === 'subscription') {
    params.subscription_data = { metadata: meta };
    if (discountCents > 0) {
      const coupon = await stripe.coupons.create({ amount_off: discountCents, currency: 'usd', duration: 'once', max_redemptions: 1, name: String(discountName || 'Discount').slice(0, 40) });
      params.discounts = [{ coupon: coupon.id }];
    }
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create(params, { idempotencyKey: `checkout-${payment.id}` });
  } catch (e) {
    await supabase.from('payments').update({ status: 'failed', metadata: { ...metadata, error: e.message }, updated_at: new Date() }).eq('id', payment.id);
    throw e;
  }
  await supabase.from('payments').update({ stripe_session_id: session.id, updated_at: new Date() }).eq('id', payment.id);
  return { url: session.url, sessionId: session.id, paymentId: payment.id };
};

const paymentForSession = async (session) => {
  const { data } = await supabase.from('payments').select('*').eq('stripe_session_id', session.id).maybeSingle();
  if (data) return data;
  const id = session.metadata?.payment_id || session.client_reference_id;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data: byId } = await supabase.from('payments').select('*').eq('id', id).maybeSingle();
  return byId || null;
};

/** Payment received: flip pending → paid once, then let the purchase's controller deliver it. */
const markPaid = async (payment, session) => {
  const stripe = getStripe();
  const updates = {
    status: 'paid',
    paid_at: new Date().toISOString(),
    stripe_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
    stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null,
    stripe_customer_id: (typeof session.customer === 'string' ? session.customer : session.customer?.id) || payment.stripe_customer_id || null,
    amount: dollars(session.amount_total),
    updated_at: new Date().toISOString(),
  };
  // A subscription's first charge belongs to its first invoice; keep it so refunds can be matched.
  if (updates.stripe_subscription_id && !updates.stripe_payment_intent_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(updates.stripe_subscription_id, { expand: ['latest_invoice'] });
      const inv = sub.latest_invoice;
      if (inv && typeof inv === 'object') {
        updates.stripe_invoice_id = inv.id;
        updates.stripe_payment_intent_id = typeof inv.payment_intent === 'string' ? inv.payment_intent : inv.payment_intent?.id || null;
      }
    } catch (e) {
      console.warn('[Stripe] could not read the first invoice:', e.message);
    }
  }
  const { data: won } = await supabase.from('payments').update(updates).eq('id', payment.id).eq('status', 'pending').select().maybeSingle();
  if (!won) return (await supabase.from('payments').select('*').eq('id', payment.id).maybeSingle()).data;

  const hooks = hookKinds()[won.kind];
  try {
    if (hooks?.onPaid) await hooks.onPaid(won, session);
  } catch (e) {
    // Put it back so Stripe's retry (or the buyer's return page) delivers it again.
    await supabase.from('payments').update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', won.id);
    throw e;
  }
  return won;
};

const markFailed = async (payment, status = 'expired') => {
  const { data: won } = await supabase.from('payments').update({ status, updated_at: new Date().toISOString() }).eq('id', payment.id).eq('status', 'pending').select().maybeSingle();
  if (!won) return (await supabase.from('payments').select('*').eq('id', payment.id).maybeSingle()).data;
  const hooks = hookKinds()[won.kind];
  try {
    if (hooks?.onFailed) await hooks.onFailed(won);
  } catch (e) {
    console.error('[Stripe] onFailed hook:', e.message);
  }
  return won;
};

/** Read a Checkout from Stripe and bring our records in line with it (used by the webhook and the return page). */
const syncSession = async (sessionId) => {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  let payment = await paymentForSession(session);
  if (!payment) return { payment: null, session };
  const paid = session.status === 'complete' && ['paid', 'no_payment_required'].includes(session.payment_status);
  if (paid) payment = await markPaid(payment, session);
  else if (session.status === 'expired') payment = await markFailed(payment, 'expired');
  return { payment, session };
};

/** The buyer pressed "back" on Stripe's page: close that Checkout so anything it held is released. */
const cancelCheckout = async (paymentId) => {
  const stripe = getStripe();
  const { data: payment } = await supabase.from('payments').select('*').eq('id', paymentId).maybeSingle();
  if (!payment) return null;
  if (payment.status !== 'pending' || !payment.stripe_session_id) return payment;
  const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);
  if (session.status === 'open') {
    try {
      await stripe.checkout.sessions.expire(session.id);
    } catch (e) {
      console.warn('[Stripe] could not close checkout:', e.message);
    }
  }
  return (await syncSession(session.id)).payment;
};

/** charge.refunded: record the refund and undo what the payment delivered when it is a full refund. */
const onChargeRefunded = async (chargeId) => {
  const stripe = getStripe();
  const charge = await stripe.charges.retrieve(chargeId);
  const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!intentId) return;
  const { data: payment } = await supabase.from('payments').select('*').eq('stripe_payment_intent_id', intentId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!payment) return;
  const refunded = dollars(charge.amount_refunded);
  const full = !!charge.refunded || charge.amount_refunded >= charge.amount;
  const status = full ? 'refunded' : 'partially_refunded';
  if (payment.status === status && Number(payment.amount_refunded) === refunded) return; // nothing new
  const { data: updated } = await supabase
    .from('payments')
    .update({ status, amount_refunded: refunded, updated_at: new Date().toISOString() })
    .eq('id', payment.id)
    .neq('status', 'refunded')
    .select()
    .maybeSingle();
  if (!updated) return;
  const hooks = hookKinds()[payment.kind];
  if (hooks?.onRefund) await hooks.onRefund(updated, { full, refunded });
};

/** Stripe's customer page where a member updates their card, sees invoices or cancels their plan. */
const billingPortalUrl = async (userId, returnUrl) => {
  const stripe = getStripe();
  const { data: u } = await supabase.from('users').select('stripe_customer_id').eq('id', userId).maybeSingle();
  if (!u?.stripe_customer_id) return null;
  // The portal needs a saved configuration; create one the first time instead of asking for dashboard setup.
  const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 10 });
  let configuration = (configs.data.find((c) => c.is_default) || configs.data[0])?.id;
  if (!configuration) {
    const created = await stripe.billingPortal.configurations.create({
      business_profile: { headline: 'AMPEX World Records membership', privacy_policy_url: `${siteUrl()}/privacy`, terms_of_service_url: `${siteUrl()}/terms` },
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        customer_update: { enabled: true, allowed_updates: ['email', 'name', 'address'] },
        subscription_cancel: { enabled: true, mode: 'at_period_end' },
      },
    });
    configuration = created.id;
  }
  const session = await stripe.billingPortal.sessions.create({ customer: u.stripe_customer_id, configuration, return_url: returnUrl || `${siteUrl()}/elite` });
  return session.url;
};

module.exports = {
  API_VERSION, stripeEnabled, stripeMode, getStripe, cents, dollars, returnBase,
  ensureCustomer, createCheckout, syncSession, markPaid, markFailed, cancelCheckout,
  onChargeRefunded, billingPortalUrl, paymentForSession,
};
