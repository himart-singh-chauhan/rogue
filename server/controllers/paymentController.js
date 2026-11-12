// Stripe endpoints: the webhook, the "you're back from Stripe" check, cancelling a checkout,
// and the member's billing page.
const supabase = require('../config/supabase');
const stripeLib = require('../utils/stripe');
const mux = require('../utils/mux');

const isSessionId = (v) => /^cs_(test|live)_[A-Za-z0-9]+$/.test(String(v || ''));
const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));

// What the return page shows for each kind of purchase
const detailsFor = async (payment) => {
  if (!payment) return null;
  if (payment.kind === 'shop') {
    const { data: order } = await supabase
      .from('orders')
      .select('id, subtotal, discount_amount, reward_discount, reward_level, total, payment_status, items:order_items(product_name, quantity, price, size, color, event_id)')
      .eq('id', payment.reference_id)
      .maybeSingle();
    return order ? { order } : null;
  }
  if (payment.kind === 'submission') {
    const { data: rec } = await supabase.from('records').select('id, title, record_type').eq('id', payment.reference_id).maybeSingle();
    const { data: meta } = await supabase.from('record_meta').select('payment_status, tracking_number, submission_fee').eq('record_id', payment.reference_id).maybeSingle();
    return { record: rec ? { id: rec.id, title: rec.title, recordType: rec.record_type } : null, trackingNumber: meta?.tracking_number || null, paymentStatus: meta?.payment_status || null };
  }
  if (payment.kind === 'membership') {
    const { data: m } = await supabase.from('memberships').select('id, tier, status, end_date, auto_renew').eq('id', payment.reference_id).maybeSingle();
    let planName = m?.tier || '';
    if (m) {
      const { data: plan } = await supabase.from('membership_plans').select('name').eq('slug', m.tier).maybeSingle();
      planName = plan?.name || m.tier;
    }
    return m ? { membership: { id: m.id, tier: m.tier, planName, status: m.status, endDate: m.end_date, autoRenew: m.auto_renew } } : null;
  }
  return null;
};

const publicPayment = (p) => p && ({
  id: p.id, kind: p.kind, referenceId: p.reference_id, status: p.status, amount: Number(p.amount), amountRefunded: Number(p.amount_refunded || 0), paidAt: p.paid_at,
});

// Members may only look at their own payments; guest shop orders are reachable by their (secret) session id.
const canSee = (payment, user) => !payment.user_id || (user && (user.is_admin || String(user.id) === String(payment.user_id)));

// @route GET /api/payments/stripe/session/:sessionId   (optionalAuth)
const getSessionStatus = async (req, res) => {
  try {
    if (!isSessionId(req.params.sessionId)) return res.status(404).json({ message: 'Payment not found' });
    const { payment } = await stripeLib.syncSession(req.params.sessionId);
    if (!payment || !canSee(payment, req.user)) return res.status(404).json({ message: 'Payment not found' });
    res.json({ payment: publicPayment(payment), ...(await detailsFor(payment)) });
  } catch (e) {
    if (e.status === 503) return res.status(503).json({ message: e.message });
    if (e.code === 'resource_missing') return res.status(404).json({ message: 'Payment not found' });
    console.error('getSessionStatus:', e.message);
    res.status(500).json({ message: 'Could not check the payment. Please refresh the page.' });
  }
};

// @route POST /api/payments/stripe/cancel/:paymentId   (optionalAuth)
const cancelPayment = async (req, res) => {
  try {
    if (!isUUID(req.params.paymentId)) return res.status(404).json({ message: 'Payment not found' });
    const { data: existing } = await supabase.from('payments').select('*').eq('id', req.params.paymentId).maybeSingle();
    if (!existing || !canSee(existing, req.user)) return res.status(404).json({ message: 'Payment not found' });
    const payment = await stripeLib.cancelCheckout(existing.id);
    res.json({ payment: publicPayment(payment) });
  } catch (e) {
    if (e.status === 503) return res.status(503).json({ message: e.message });
    console.error('cancelPayment:', e.message);
    res.status(500).json({ message: 'Could not cancel the checkout.' });
  }
};

// @route POST /api/payments/stripe/portal   (protect)
const billingPortal = async (req, res) => {
  try {
    const url = await stripeLib.billingPortalUrl(req.user.id, `${stripeLib.returnBase(req)}/elite`);
    if (!url) return res.status(404).json({ message: 'There is no card payment on your account yet.' });
    res.json({ url });
  } catch (e) {
    if (e.status === 503) return res.status(503).json({ message: e.message });
    console.error('billingPortal:', e.message);
    res.status(500).json({ message: 'Could not open the billing page. Please try again.' });
  }
};

// @route GET /api/payments/config   (admin) — what is switched on, without revealing any key
const getConfig = async (req, res) => {
  res.json({
    stripe: { enabled: stripeLib.stripeEnabled(), mode: stripeLib.stripeMode(), webhook: !!String(process.env.STRIPE_WEBHOOK_SECRET || '').trim() },
    mux: { enabled: mux.muxEnabled(), signedPlayback: mux.signingEnabled(), webhook: !!String(process.env.MUX_WEBHOOK_SECRET || '').trim() },
  });
};

const handleStripeEvent = async (event) => {
  const obj = event.data?.object || {};
  const membership = require('./membershipController');
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.expired':
      await stripeLib.syncSession(obj.id);
      break;
    case 'checkout.session.async_payment_failed': {
      const session = await stripeLib.getStripe().checkout.sessions.retrieve(obj.id);
      const payment = await stripeLib.paymentForSession(session);
      if (payment) await stripeLib.markFailed(payment, 'failed');
      break;
    }
    case 'invoice.paid':
      await membership.onInvoicePaid(obj.id);
      break;
    case 'invoice.payment_failed':
      await membership.onInvoiceFailed(obj.id);
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await membership.onSubscriptionChange(obj.id, event.type === 'customer.subscription.deleted');
      break;
    case 'charge.refunded':
      await stripeLib.onChargeRefunded(obj.id);
      break;
    default:
      break; // not used by the site
  }
};

// @route POST /api/payments/stripe/webhook   (Stripe only: checked with the signing secret)
const stripeWebhook = async (req, res) => {
  const secret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!secret || !stripeLib.stripeEnabled()) return res.status(503).json({ message: 'Stripe webhook is not configured' });
  if (!req.rawBody) return res.status(400).json({ message: 'Missing body' });
  let event;
  try {
    event = stripeLib.getStripe().webhooks.constructEvent(req.rawBody, req.get('stripe-signature'), secret);
  } catch {
    return res.status(400).json({ message: 'Webhook signature check failed' });
  }
  try {
    const { data: seen } = await supabase.from('stripe_events').select('id').eq('id', event.id).maybeSingle();
    if (seen) return res.json({ received: true, duplicate: true });
    await handleStripeEvent(event);
    const { error } = await supabase.from('stripe_events').insert([{ id: event.id, type: event.type }]);
    if (error && error.code !== '23505') console.warn('[Stripe] could not log event:', error.message);
    res.json({ received: true });
  } catch (e) {
    // 500 makes Stripe retry later; every step above is safe to repeat.
    console.error(`[Stripe] ${event.type} ${event.id} failed:`, e.message);
    res.status(500).json({ message: 'Webhook handling failed' });
  }
};

module.exports = { getSessionStatus, cancelPayment, billingPortal, getConfig, stripeWebhook, handleStripeEvent };
