// Admin → Users → a member's full profile: everything about one member on one screen.
const supabase = require('../config/supabase');
const rewards = require('../utils/rewards');

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
const USER_COLUMNS = 'id, name, email, is_admin, role, membership_type, account_status, suspended_until, suspension_reason, profile_image, username, phone, gender, dob, weight, weight_unit, height, height_unit, country, city, street_address, apartment, state, zip_code, member_number, created_at, last_login_at, referral_code, referred_by';

// Pick only the columns that exist (older databases may miss a few optional ones)
const loadUser = async (id) => {
  let { data, error } = await supabase.from('users').select(USER_COLUMNS).eq('id', id).maybeSingle();
  if (error) ({ data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle());
  if (error) throw error;
  if (data) { delete data.password; }
  return data;
};

// GET /api/admin/members/:id/overview
const getMemberOverview = async (req, res) => {
  const { id } = req.params;
  if (!isUUID(id)) return res.status(404).json({ message: 'Member not found' });
  try {
    const user = await loadUser(id);
    if (!user) return res.status(404).json({ message: 'Member not found' });

    const safe = (p) => p.then((r) => r.data || []).catch(() => []);
    const [ranking, records, memberships, orders, certificates, messages, tickets, approvals, referrer] = await Promise.all([
      supabase.from('user_rankings').select('total_points, global_rank, verified_records_count, world_records_count, tier_badge').eq('user_id', id).maybeSingle().then((r) => r.data || null),
      safe(supabase.from('records').select('id, title, category, value, unit, status, verification_status, record_type, created_at, verified_at, slug').eq('user_id', id).order('created_at', { ascending: false }).limit(200)),
      safe(supabase.from('memberships').select('id, tier, status, start_date, end_date, price, payment_history, created_at').eq('user_id', id).order('created_at', { ascending: false })),
      safe(supabase.from('orders').select('id, total, subtotal, discount, reward_discount, payment_status, shipping_status, created_at, items:order_items(product_name, quantity, price, size, notes)').or(`user_id.eq.${id},customer_email.eq.${String(user.email || '').replace(/[,()]/g, '')}`).order('created_at', { ascending: false }).limit(100)),
      safe(supabase.from('certificate_issuances').select('id, certificate_number, record_title, status, issued_at, created_at').eq('user_id', id).order('created_at', { ascending: false })),
      safe(supabase.from('messages').select('id, subject, body, is_read, created_at').eq('receiver_id', id).order('created_at', { ascending: false }).limit(50)),
      safe(supabase.from('tickets').select('id, status, created_at, event:events(title, date)').eq('user_id', id).order('created_at', { ascending: false })),
      safe(supabase.from('product_authorizations').select('id, status, created_at, product:products(name)').eq('user_id', id).order('created_at', { ascending: false })),
      user.referred_by ? supabase.from('users').select('id, name').eq('id', user.referred_by).maybeSingle().then((r) => r.data || null) : Promise.resolve(null),
    ]);

    const payments = [];
    memberships.forEach((m) => (m.payment_history || []).forEach((p) => payments.push({ kind: 'Membership', plan: m.tier, amount: p.amount, status: p.status, date: p.date, reference: p.transactionId })));
    orders.forEach((o) => payments.push({ kind: 'Shop order', amount: Number(o.total), status: o.payment_status, date: o.created_at, reference: String(o.id).slice(0, 8).toUpperCase() }));
    payments.sort((a, b) => new Date(b.date) - new Date(a.date));

    let reward = null;
    try { reward = await rewards.summaryFor(id); } catch { reward = null; }

    res.json({
      user,
      ranking,
      records,
      challenges: records.filter((r) => r.record_type === 'challenge'),
      memberships,
      activeMembership: memberships.find((m) => m.status === 'active') || null,
      orders,
      payments,
      certificates,
      messages,
      tickets,
      approvals,
      rewards: reward ? { ...reward, referralCode: user.referral_code, referredBy: referrer } : null,
      emailService: !!process.env.RESEND_API_KEY,
    });
  } catch (e) {
    res.status(500).json({ message: 'Could not load this member', error: e.message });
  }
};

// POST /api/admin/members/:id/email { subject, body } — real email when an email service is connected
const emailMember = async (req, res) => {
  const subject = String(req.body.subject || '').trim().slice(0, 200);
  const body = String(req.body.body || '').trim().slice(0, 10000);
  if (!subject || !body) return res.status(400).json({ message: 'Subject and message are required' });
  if (!process.env.RESEND_API_KEY) {
    return res.status(501).json({ message: 'Sending email from the site needs an email service (not connected yet). Use "Open in my email app" instead.' });
  }
  try {
    const user = await loadUser(req.params.id);
    if (!user?.email) return res.status(404).json({ message: 'Member not found' });
    const from = process.env.EMAIL_FROM || 'AMPEX World Records <onboarding@resend.dev>';
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [user.email], subject, text: body }),
    });
    if (!r.ok) return res.status(502).json({ message: 'The email service refused the message' });
    await supabase.from('audit_logs').insert({ actor_id: req.user.id, action_type: 'email_member', metadata: { to: user.id, subject } });
    res.json({ message: `Email sent to ${user.email}` });
  } catch (e) {
    res.status(500).json({ message: 'Email could not be sent', error: e.message });
  }
};

module.exports = { getMemberOverview, emailMember };
