// Sending email to members from the AMPEX address (ampexworldrecords@gmail.com) through Gmail.
//
// Setup (Vercel → rogue-api → Environment Variables):
//   GMAIL_USER          ampexworldrecords@gmail.com
//   GMAIL_APP_PASSWORD  the 16-letter App Password made in that Google account
//                       (Google Account → Security → 2-Step Verification → App passwords)
//   EMAIL_FROM_NAME     optional, defaults to "AMPEX World Records"
// RESEND_API_KEY still works as an alternative service. EMAIL_TRANSPORT=json is for tests only:
// nothing leaves the machine.
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { siteUrl } = require('./notify');

const mode = () => {
  if (process.env.EMAIL_TRANSPORT === 'json') return 'test';
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return 'gmail';
  if (process.env.RESEND_API_KEY) return 'resend';
  return null;
};
const emailEnabled = () => !!mode();
const senderAddress = () => process.env.GMAIL_USER || process.env.EMAIL_FROM_ADDRESS || 'ampexworldrecords@gmail.com';
const fromHeader = () => `"${(process.env.EMAIL_FROM_NAME || 'AMPEX World Records').replace(/"/g, '')}" <${senderAddress()}>`;

let transport = null;
const getTransport = () => {
  if (transport) return transport;
  if (mode() === 'test') transport = nodemailer.createTransport({ jsonTransport: true });
  else transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '') },
    pool: true,
    maxConnections: 2,
  });
  return transport;
};

// Test mode keeps what would have been sent, so tests can read it
const outbox = [];

const send = async ({ to, subject, html, text, headers = {} }) => {
  const m = mode();
  if (!m) { const e = new Error('Email is not set up on the server (GMAIL_USER / GMAIL_APP_PASSWORD missing).'); e.status = 501; throw e; }
  if (m === 'resend') {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || fromHeader(), to: [to], subject, html, text, headers }),
    });
    if (!r.ok) throw new Error(`The email service refused the message (${r.status})`);
    return { id: (await r.json().catch(() => ({}))).id };
  }
  const info = await getTransport().sendMail({ from: fromHeader(), to, subject, html, text, headers, replyTo: senderAddress() });
  if (m === 'test') outbox.push({ to, subject, html, text, headers });
  return { id: info.messageId };
};

// ---------- unsubscribe links (marketing email) ----------
const secret = () => process.env.JWT_SECRET || 'ampex-unsubscribe';
const unsubscribeToken = (userId) => crypto.createHmac('sha256', secret()).update(`unsubscribe:${userId}`).digest('hex').slice(0, 32);
const checkUnsubscribeToken = (userId, token) => {
  const good = unsubscribeToken(userId);
  return typeof token === 'string' && token.length === good.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(good));
};
const apiBase = (req) => {
  if (process.env.PUBLIC_API_URL) return process.env.PUBLIC_API_URL.replace(/\/+$/, '');
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || 'rogue-api.vercel.app';
  const proto = /localhost|127\.0\.0\.1/.test(host) ? 'http' : 'https';
  return `${proto}://${host}`;
};
const unsubscribeUrl = (req, userId) => `${apiBase(req)}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;
// The link people see in the email opens a page on the AMPEX website (not the API address)
const unsubscribePageUrl = (userId) => `${siteUrl()}/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;
// People outside the community are identified by their email address
const emailKey = (address) => `e:${String(address || '').trim().toLowerCase()}`;
const outsideUnsubscribePageUrl = (address) => `${siteUrl()}/unsubscribe?e=${encodeURIComponent(String(address).trim().toLowerCase())}&t=${unsubscribeToken(emailKey(address))}`;
const outsideUnsubscribeUrl = (req, address) => `${apiBase(req)}/api/email/unsubscribe?e=${encodeURIComponent(String(address).trim().toLowerCase())}&t=${unsubscribeToken(emailKey(address))}`;

// ---------- the email itself ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const absolute = (url) => {
  const u = String(url || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('/')) return `${siteUrl()}${u}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ''; // javascript:, data:, mailto: … are not web links
  return `https://${u}`;
};
// Only real web addresses: http(s), a host with a dot (or localhost), no spaces or quotes
const safeLink = (url) => {
  const u = absolute(url);
  if (!/^https?:\/\/[^\s"'<>]+$/i.test(u)) return '';
  try {
    const { hostname, protocol } = new URL(u);
    if (!/^https?:$/.test(protocol)) return '';
    return hostname.includes('.') || hostname === 'localhost' ? u : '';
  } catch { return ''; }
};
// Plain text with line breaks; web addresses become links
const bodyHtml = (text) => esc(text)
  .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, (m) => `<a href="${m}" style="color:#a0741c;">${m}</a>`)
  .replace(/\r?\n/g, '<br>');
const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';
const personalise = (text, member) => String(text || '').replace(/\{\{\s*name\s*\}\}/gi, firstName(member?.name));

/**
 * Builds the email in the AMPEX template (Curtis's design, Nov 2026): header and footer are images cut from
 * the design (client/public/email/), the card in between is real text so names and messages fill in.
 * kind 'marketing' adds the unsubscribe link (account emails always arrive).
 */
const FONT = "Arial,Helvetica,sans-serif";
const fullName = (member) => String(member?.name || '').trim() || 'Member';
const buildEmail = ({ subject, body, imageUrl, buttonText, buttonUrl, member, kind, unsubscribe, outside = false }) => {
  const text = personalise(body, member);
  const img = safeLink(imageUrl);
  const btnUrl = safeLink(buttonUrl);
  const btnText = String(buttonText || '').trim() || (btnUrl ? 'Open' : '');
  const site = siteUrl();
  const host = site.replace(/^https?:\/\//, '');
  const asset = (name) => `${esc(site)}/email/${name}`;
  const p = (inner, extra = '') => `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.5;color:#111111;${extra}">${inner}</p>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(personalise(subject, member))}</title></head>
<body style="margin:0;padding:0;background:#000000;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(text.slice(0, 140))}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;"><tr><td align="center" style="padding:0;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#000000;">
<tr><td><a href="${esc(site)}" style="text-decoration:none;"><img src="${asset('header.jpg')}" alt="AMPEX World Records · Achievement · Recognition · Excellence" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></a></td></tr>
<tr><td style="padding:0 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:4px solid #c99a2e;border-radius:12px;">
<tr><td style="padding:26px 26px 18px;">
${p(`<strong style="font-size:18px;">Dear ${esc(fullName(member))},</strong>`, 'margin-bottom:12px;')}
${p(`Welcome to <strong>Ampex World Records</strong>, where extraordinary talent, dedication, and achievement deserve to be recognized.`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;"><tr><td style="background:#fcf3dc;border:2px solid #d9aa3c;border-radius:10px;padding:16px 18px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.55;color:#1d1508;font-style:italic;font-weight:bold;text-align:center;">${bodyHtml(text)}</td></tr></table>
${img ? `<p style="margin:0 0 18px;"><img src="${esc(img)}" alt="" width="536" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:8px;"></p>` : ''}
${btnUrl ? `<p style="margin:0 0 20px;text-align:center;"><a href="${esc(btnUrl)}" style="display:inline-block;background:#c99a2e;color:#111111;text-decoration:none;font-family:${FONT};font-weight:bold;padding:13px 28px;border-radius:100px;font-size:15px;">${esc(btnText)}</a></p>` : ''}
${p('We believe everyone deserves an opportunity to showcase their skills and talents, regardless of age or background.')}
<p style="margin:4px -26px 18px;"><img src="${asset('legacy-banner.jpg')}" alt="Your Talent. Your Achievement. Your Legacy." width="548" style="display:block;width:100%;max-width:548px;height:auto;border:0;"></p>
${p('Thank you for being part of the Ampex World Records community.')}
${p('Sincerely,', 'margin-bottom:4px;')}
<p style="margin:0;"><img src="${asset('signature.jpg')}" alt="Ampex World Records Team" width="300" style="display:block;width:300px;max-width:60%;height:auto;border:0;"></p>
${p('Official World Record Verification &amp; Recognition', 'margin:2px 0 0;')}
</td></tr></table>
</td></tr>
<tr><td><img src="${asset('footer.jpg')}" alt="Dare to be extraordinary · ${esc(host)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>
<tr><td style="padding:6px 16px 22px;text-align:center;font-family:${FONT};font-size:12px;line-height:1.6;color:#9a9a9a;">
<a href="${esc(site)}" style="color:#d9aa3c;text-decoration:none;">${esc(host)}</a><br>
${outside && unsubscribe ? `You received this email from Ampex World Records. <a href="${esc(unsubscribe)}" style="color:#9a9a9a;">Unsubscribe</a>.` : kind === 'marketing' && unsubscribe ? `You get these emails because you are an Ampex World Records member. <a href="${esc(unsubscribe)}" style="color:#9a9a9a;">Unsubscribe from promotional emails</a>.` : 'This message is about your Ampex World Records account.'}
</td></tr>
</table></td></tr></table></body></html>`;
  const plain = `Dear ${fullName(member)},

Welcome to Ampex World Records, where extraordinary talent, dedication, and achievement deserve to be recognized.

${text}${btnUrl ? `\n\n${btnText}: ${btnUrl}` : ''}

We believe everyone deserves an opportunity to showcase their skills and talents, regardless of age or background.

Your Talent. Your Achievement. Your Legacy.

Thank you for being part of the Ampex World Records community.

Sincerely,
Ampex World Records Team
Official World Record Verification & Recognition

${host}${(outside || kind === 'marketing') && unsubscribe ? `\nUnsubscribe: ${unsubscribe}` : ''}`;
  return { subject: personalise(subject, member), html, text: plain };
};

module.exports = {
  emailEnabled, emailMode: mode, senderAddress, send, buildEmail, outbox,
  unsubscribeToken, checkUnsubscribeToken, unsubscribeUrl, unsubscribePageUrl, safeLink, emailKey, outsideUnsubscribePageUrl, outsideUnsubscribeUrl,
};
