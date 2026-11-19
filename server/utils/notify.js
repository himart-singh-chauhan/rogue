const supabase = require('../config/supabase');

// The public website address, for links in messages, emails and referral links.
// PUBLIC_SITE_URL wins; otherwise the first CLIENT_URLS entry that is an AMPEX address (not the old
// "rogue-client" one), so adding the AMPEX domain to CLIENT_URLS switches every link over.
const withScheme = (u) => (/^https?:\/\//.test(u) ? u : `https://${u}`);
const siteUrl = () => {
  const pinned = String(process.env.PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (pinned) return withScheme(pinned);
  const list = String(process.env.CLIENT_URLS || '').split(',').map((x) => x.trim().replace(/\/+$/, '')).filter(Boolean)
    .filter((x) => !/localhost|127\.0\.0\.1/.test(x));
  const ampex = list.find((x) => !/rogue/i.test(x));
  const pick = ampex || list[0];
  return pick ? withScheme(pick) : 'https://rogue-client.vercel.app';
};

/**
 * Put a message in a member's inbox (Profile → Messages). Never throws: a failed
 * notification must not undo the action that triggered it.
 */
const notifyMember = async ({ userId, senderId = null, subject, body }) => {
  if (!userId || !subject || !body) return;
  const { error } = await supabase.from('messages').insert([{ sender_id: senderId, receiver_id: userId, subject, body }]);
  if (error) console.warn('[Inbox] could not notify member:', error.message);
};

/**
 * Tell the AMPEX admins about something they need to act on: a message in every admin's inbox and an email
 * to the AMPEX address (ADMIN_NOTIFY_EMAIL, or the Gmail account the site sends from). Never throws.
 */
const notifyAdmins = async ({ subject, body, link, linkText = 'Open in admin' }) => {
  try {
    const { data: admins } = await supabase.from('users').select('id').eq('is_admin', true).neq('account_status', 'banned');
    const text = link ? `${body}\n\n${linkText}: ${link}` : body;
    await Promise.all((admins || []).map((a) => notifyMember({ userId: a.id, subject, body: text })));
    const email = require('./email'); // loaded here: email.js itself needs siteUrl from this file
    const to = String(process.env.ADMIN_NOTIFY_EMAIL || process.env.GMAIL_USER || '').trim();
    if (to && email.emailEnabled()) {
      const msg = email.buildEmail({ subject, body, buttonText: link ? linkText : undefined, buttonUrl: link || undefined, member: { name: 'AMPEX Admin' }, kind: 'account' });
      await email.send({ to, subject: msg.subject, html: msg.html, text: msg.text });
    }
  } catch (e) {
    console.warn('[Admin alert] could not notify admins:', e.message);
  }
};

module.exports = { notifyMember, notifyAdmins, siteUrl };
