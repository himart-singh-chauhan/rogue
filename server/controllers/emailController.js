// Admin → Email members: send an email to one member, a selection, a group or everyone, from the AMPEX address.
// Every send is saved (email_campaigns + one email_deliveries row per member) so admins can see the history.
// Big sends go out in small batches: the admin page keeps calling /continue until all are sent, which keeps
// each request short (Vercel time limit) and lets a send carry on after a hiccup.
const supabase = require('../config/supabase');
const email = require('../utils/email');

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
const BATCH = 8;
const BATCH_TIME_MS = 6000;
const MAX_RECIPIENTS = 5000;
const clean = (v, max) => String(v ?? '').trim().slice(0, max);

// ---------- who gets it ----------
const AUDIENCE_TYPES = ['member', 'selected', 'group', 'all'];
const labelFor = (a, count) => {
  if (a.type === 'member') return '1 member';
  if (a.type === 'selected') return `${count} selected members`;
  if (a.type === 'all') return 'All members';
  const parts = [];
  if (a.membership?.length) parts.push(`plan: ${a.membership.join(', ')}`);
  if (a.role?.length) parts.push(`role: ${a.role.join(', ')}`);
  if (a.country) parts.push(`country: ${a.country}`);
  return `Group (${parts.join(' · ') || 'all members'})`;
};

const normaliseAudience = (raw = {}) => {
  const type = AUDIENCE_TYPES.includes(raw.type) ? raw.type : null;
  if (!type) return null;
  const a = { type };
  if (type === 'member') { if (!isUUID(raw.userId)) return null; a.userId = raw.userId; }
  if (type === 'selected') {
    a.userIds = [...new Set((Array.isArray(raw.userIds) ? raw.userIds : []).filter(isUUID))].slice(0, 1000);
    if (!a.userIds.length) return null;
  }
  if (type === 'group') {
    const list = (v) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => clean(x, 60)).filter(Boolean).slice(0, 20);
    a.membership = list(raw.membership);
    a.role = list(raw.role);
    a.country = clean(raw.country, 80) || undefined;
  }
  return a;
};

// Members with an email address and an active account; marketing email skips members who opted out
const resolveRecipients = async (audience, kind) => {
  let q = supabase.from('users').select('id, name, email, account_status, marketing_opt_out').not('email', 'is', null).limit(MAX_RECIPIENTS + 1);
  if (audience.type === 'member') q = q.eq('id', audience.userId);
  if (audience.type === 'selected') q = q.in('id', audience.userIds);
  if (audience.type === 'group') {
    if (audience.membership?.length) q = q.in('membership_type', audience.membership);
    if (audience.role?.length) q = q.in('role', audience.role);
    if (audience.country) q = q.ilike('country', audience.country);
  }
  const { data, error } = await q;
  if (error) throw error;
  const users = (data || []).filter((u) => /\S+@\S+\.\S+/.test(u.email || ''));
  // one member picked by hand still gets account email even when suspended; group sends only reach active accounts
  const reachable = audience.type === 'member' ? users : users.filter((u) => !u.account_status || u.account_status === 'active');
  const optedOut = kind === 'marketing' ? reachable.filter((u) => u.marketing_opt_out) : [];
  const recipients = reachable.filter((u) => !(kind === 'marketing' && u.marketing_opt_out));
  return { recipients, skipped: optedOut.length };
};

const readContent = (b) => ({
  subject: clean(b.subject, 200),
  body: clean(b.body, 20000),
  image_url: email.safeLink(b.imageUrl) || null,
  button_text: clean(b.buttonText, 60) || null,
  button_url: email.safeLink(b.buttonUrl) || null,
  kind: b.kind === 'marketing' ? 'marketing' : 'account',
});
const contentError = (c, b) => {
  if (!c.subject) return 'Write a subject.';
  if (!c.body) return 'Write the message.';
  if (b.imageUrl && !c.image_url) return 'The image address is not a valid web link.';
  if (b.buttonUrl && !c.button_url) return 'The button link is not a valid web address (it should start with https://).';
  return null;
};

// ---------- sending ----------
const finishIfDone = async (campaignId) => {
  const { data: rows } = await supabase.from('email_deliveries').select('status').eq('campaign_id', campaignId);
  const counts = { pending: 0, sending: 0, sent: 0, failed: 0 };
  (rows || []).forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
  const open = counts.pending + counts.sending;
  const patch = { sent_count: counts.sent, failed_count: counts.failed };
  if (!open) {
    patch.status = counts.failed === 0 ? 'sent' : counts.sent === 0 ? 'failed' : 'partial';
    patch.finished_at = new Date().toISOString();
  }
  const { data } = await supabase.from('email_campaigns').update(patch).eq('id', campaignId).select('*').single();
  return { campaign: data, remaining: open };
};

const sendBatch = async (req, campaign) => {
  const started = Date.now();
  // Claim a batch (pending → sending), so two tabs cannot send the same email twice
  const { data: pending } = await supabase.from('email_deliveries').select('id').eq('campaign_id', campaign.id).eq('status', 'pending').order('created_at').limit(BATCH);
  const ids = (pending || []).map((r) => r.id);
  if (ids.length) {
    const { data: claimed } = await supabase.from('email_deliveries').update({ status: 'sending', claimed_at: new Date().toISOString() }).in('id', ids).eq('status', 'pending').select('id, user_id, email, name');
    for (const d of claimed || []) {
      if (Date.now() - started > BATCH_TIME_MS) { await supabase.from('email_deliveries').update({ status: 'pending' }).eq('id', d.id); continue; }
      const msg = email.buildEmail({
        subject: campaign.subject, body: campaign.body, imageUrl: campaign.image_url,
        buttonText: campaign.button_text, buttonUrl: campaign.button_url, member: { name: d.name },
        kind: campaign.kind, unsubscribe: d.user_id ? email.unsubscribeUrl(req, d.user_id) : null,
      });
      const headers = campaign.kind === 'marketing' && d.user_id
        ? { 'List-Unsubscribe': `<${email.unsubscribeUrl(req, d.user_id)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
        : {};
      try {
        await email.send({ to: d.name ? `"${String(d.name).replace(/"/g, '')}" <${d.email}>` : d.email, subject: msg.subject, html: msg.html, text: msg.text, headers });
        await supabase.from('email_deliveries').update({ status: 'sent', sent_at: new Date().toISOString(), error: null }).eq('id', d.id);
      } catch (e) {
        await supabase.from('email_deliveries').update({ status: 'failed', error: String(e.message || e).slice(0, 300) }).eq('id', d.id);
        if (e.status === 501) break;
      }
    }
  }
  // Rows stuck in "sending" for over 2 minutes (a crashed request) go back in the queue
  await supabase.from('email_deliveries').update({ status: 'pending' }).eq('campaign_id', campaign.id).eq('status', 'sending').lt('claimed_at', new Date(Date.now() - 120000).toISOString());
  return finishIfDone(campaign.id);
};

const progressOf = ({ campaign, remaining }) => ({
  campaign,
  remaining,
  done: remaining === 0,
  message: remaining === 0
    ? (campaign.failed_count
      ? `Sent to ${campaign.sent_count} of ${campaign.recipient_count}. ${campaign.failed_count} could not be delivered.`
      : `Email sent to ${campaign.sent_count} ${campaign.sent_count === 1 ? 'member' : 'members'}.`)
    : `Sending… ${campaign.sent_count} of ${campaign.recipient_count} sent`,
});

/**
 * Creates the send and its delivery list, then sends the first batch.
 * Used by the email page and by the "Email" button on a member's profile.
 */
const createAndStart = async (req, body) => {
  const content = readContent(body);
  const err = contentError(content, body);
  if (err) return { status: 400, json: { message: err } };
  const audience = normaliseAudience(body.audience);
  if (!audience) return { status: 400, json: { message: 'Choose who should get this email.' } };
  if (!email.emailEnabled()) return { status: 501, json: { message: 'Email is not set up yet: the Gmail App Password for ampexworldrecords@gmail.com still has to be added on the server.' } };

  const requestKey = clean(body.requestKey, 80) || null;
  if (requestKey) {
    const { data: existing } = await supabase.from('email_campaigns').select('*').eq('request_key', requestKey).maybeSingle();
    if (existing) return { status: 200, json: { ...progressOf(await finishIfDone(existing.id)), duplicate: true } };
  }

  const { recipients, skipped } = await resolveRecipients(audience, content.kind);
  if (recipients.length > MAX_RECIPIENTS) return { status: 400, json: { message: `That is more than ${MAX_RECIPIENTS} members. Send to smaller groups.` } };
  if (!recipients.length) {
    return { status: 400, json: { message: skipped ? 'Everyone in this group has opted out of promotional email. Send it as an account email only if it is about their account.' : 'Nobody matches this group (members need an email address and an active account).' } };
  }

  const { data: campaign, error } = await supabase.from('email_campaigns').insert({
    ...content, audience, audience_label: labelFor(audience, recipients.length),
    recipient_count: recipients.length, skipped_count: skipped, request_key: requestKey, created_by: req.user.id,
  }).select('*').single();
  if (error) {
    if (error.code === '23505' && requestKey) {
      const { data: existing } = await supabase.from('email_campaigns').select('*').eq('request_key', requestKey).single();
      return { status: 200, json: { ...progressOf(await finishIfDone(existing.id)), duplicate: true } };
    }
    throw error;
  }
  const rows = recipients.map((u) => ({ campaign_id: campaign.id, user_id: u.id, email: u.email, name: u.name }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error: e2 } = await supabase.from('email_deliveries').insert(rows.slice(i, i + 500));
    if (e2) throw e2;
  }
  await supabase.from('audit_logs').insert({ actor_id: req.user.id, action_type: 'email_members', metadata: { campaign: campaign.id, subject: campaign.subject, recipients: recipients.length, kind: campaign.kind } }).then(() => {}, () => {});
  return { status: 201, json: progressOf(await sendBatch(req, campaign)) };
};

// POST /api/admin/emails
const createCampaign = async (req, res) => {
  try {
    const r = await createAndStart(req, req.body || {});
    res.status(r.status).json(r.json);
  } catch (e) {
    res.status(500).json({ message: 'The email could not be sent', error: e.message });
  }
};

// POST /api/admin/emails/:id/continue
const continueCampaign = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Not found' });
  try {
    const { data: campaign } = await supabase.from('email_campaigns').select('*').eq('id', req.params.id).maybeSingle();
    if (!campaign) return res.status(404).json({ message: 'Not found' });
    res.json(progressOf(await sendBatch(req, campaign)));
  } catch (e) {
    res.status(500).json({ message: 'Sending stopped, press Continue to try again', error: e.message });
  }
};

// POST /api/admin/emails/:id/retry  (failed deliveries go back in the queue)
const retryFailed = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Not found' });
  await supabase.from('email_deliveries').update({ status: 'pending', error: null }).eq('campaign_id', req.params.id).eq('status', 'failed');
  await supabase.from('email_campaigns').update({ status: 'sending', finished_at: null }).eq('id', req.params.id);
  const { data: campaign } = await supabase.from('email_campaigns').select('*').eq('id', req.params.id).maybeSingle();
  if (!campaign) return res.status(404).json({ message: 'Not found' });
  res.json(progressOf(await sendBatch(req, campaign)));
};

// POST /api/admin/emails/preview { audience, kind }  → how many members would get it
const previewAudience = async (req, res) => {
  const audience = normaliseAudience(req.body?.audience);
  if (!audience) return res.json({ count: 0, skipped: 0, sample: [] });
  try {
    const { recipients, skipped } = await resolveRecipients(audience, req.body?.kind === 'marketing' ? 'marketing' : 'account');
    res.json({ count: recipients.length, skipped, sample: recipients.slice(0, 5).map((u) => u.name || u.email), label: labelFor(audience, recipients.length) });
  } catch (e) {
    res.status(500).json({ message: 'Could not count recipients', error: e.message });
  }
};

// GET /api/admin/emails  (history)
const listCampaigns = async (req, res) => {
  const { data, error } = await supabase.from('email_campaigns')
    .select('id, subject, kind, audience_label, recipient_count, sent_count, failed_count, skipped_count, status, created_at, finished_at, sender:created_by(name)')
    .order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(500).json({ message: 'Could not load the email history', error: error.message });
  res.json({ campaigns: data || [], enabled: email.emailEnabled(), from: email.senderAddress() });
};

// GET /api/admin/emails/:id
const getCampaign = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const { data: campaign } = await supabase.from('email_campaigns').select('*, sender:created_by(name)').eq('id', req.params.id).maybeSingle();
  if (!campaign) return res.status(404).json({ message: 'Not found' });
  const { data: deliveries } = await supabase.from('email_deliveries').select('id, email, name, status, error, sent_at').eq('campaign_id', campaign.id).order('created_at').limit(2000);
  res.json({ campaign, deliveries: deliveries || [] });
};

// GET /api/admin/emails/options  (plans, roles and countries for the group picker)
const audienceOptions = async (req, res) => {
  const { data } = await supabase.from('users').select('membership_type, role, country').limit(10000);
  const uniq = (k) => [...new Set((data || []).map((u) => u[k]).filter(Boolean))].sort();
  res.json({ memberships: uniq('membership_type'), roles: uniq('role'), countries: uniq('country'), enabled: email.emailEnabled(), from: email.senderAddress() });
};

// ---------- unsubscribe (link in promotional emails) ----------
const page = (title, text) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#0A0A0A;color:#fff;font-family:Arial,Helvetica,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;">
<div style="max-width:460px;text-align:center;"><div style="color:#FF6A00;font-weight:900;letter-spacing:2px;margin-bottom:18px;">AMPEX WORLD RECORDS</div>
<h1 style="font-size:24px;margin:0 0 12px;">${title}</h1><p style="color:#aaa;line-height:1.6;">${text}</p>
<p><a href="${require('../utils/notify').siteUrl()}/profile" style="color:#FF6A00;">Go to my profile</a></p></div></body></html>`;

const unsubscribe = async (req, res) => {
  const userId = String(req.query.u || req.body?.u || '');
  const token = String(req.query.t || req.body?.t || '');
  if (!isUUID(userId) || !email.checkUnsubscribeToken(userId, token)) {
    return res.status(400).type('html').send(page('This link is not valid', 'The unsubscribe link is incomplete or expired. You can switch promotional emails off on your profile under Settings.'));
  }
  await supabase.from('users').update({ marketing_opt_out: true, marketing_opt_out_at: new Date().toISOString() }).eq('id', userId);
  if (req.method === 'POST') return res.json({ ok: true });
  res.type('html').send(page('You are unsubscribed', 'You will no longer get promotional emails from AMPEX World Records. You will still get emails about your account. You can switch promotions back on from your profile.'));
};

// GET / PUT /api/email/preferences  (member: promotional emails on or off)
const getPreferences = async (req, res) => {
  const { data, error } = await supabase.from('users').select('marketing_opt_out').eq('id', req.user.id).maybeSingle();
  if (error) return res.json({ marketingEmails: true });
  res.json({ marketingEmails: !data?.marketing_opt_out });
};
const setPreferences = async (req, res) => {
  const on = req.body?.marketingEmails !== false;
  const { error } = await supabase.from('users').update({ marketing_opt_out: !on, marketing_opt_out_at: on ? null : new Date().toISOString() }).eq('id', req.user.id);
  if (error) return res.status(500).json({ message: 'Could not save your email setting', error: error.message });
  res.json({ marketingEmails: on, message: on ? 'You will get AMPEX promotions and challenge news by email.' : 'Promotional emails are switched off. You will still get emails about your account.' });
};

module.exports = {
  getPreferences, setPreferences,
  createCampaign, continueCampaign, retryFailed, previewAudience, listCampaigns, getCampaign, audienceOptions,
  unsubscribe, createAndStart,
};
