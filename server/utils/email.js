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

// ---------- the email itself ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const absolute = (url) => {
  const u = String(url || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('/')) return `${siteUrl()}${u}`;
  return `https://${u}`;
};
const safeLink = (url) => { const u = absolute(url); return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; };
// Plain text with line breaks; web addresses become links
const bodyHtml = (text) => esc(text)
  .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, (m) => `<a href="${m}" style="color:#FF6A00;">${m}</a>`)
  .replace(/\r?\n/g, '<br>');
const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';
const personalise = (text, member) => String(text || '').replace(/\{\{\s*name\s*\}\}/gi, firstName(member?.name));

/**
 * Builds the branded HTML + plain text email.
 * kind 'marketing' adds the unsubscribe footer (account emails always arrive).
 */
const buildEmail = ({ subject, body, imageUrl, buttonText, buttonUrl, member, kind, unsubscribe }) => {
  const text = personalise(body, member);
  const img = safeLink(imageUrl);
  const btnUrl = safeLink(buttonUrl);
  const btnText = String(buttonText || '').trim() || (btnUrl ? 'Open' : '');
  const site = siteUrl();
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f1ec;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
<tr><td style="background:#0A0A0A;padding:22px 28px;text-align:center;">
<a href="${esc(site)}" style="color:#FF6A00;text-decoration:none;font-size:20px;font-weight:900;letter-spacing:2px;">AMPEX WORLD RECORDS</a></td></tr>
${img ? `<tr><td><img src="${esc(img)}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>` : ''}
<tr><td style="padding:28px 28px 8px;color:#1a1a1a;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111;">${esc(personalise(subject, member))}</h1>
<div style="font-size:15px;line-height:1.65;color:#333;">${bodyHtml(text)}</div>
${btnUrl ? `<p style="margin:26px 0 8px;"><a href="${esc(btnUrl)}" style="display:inline-block;background:#FF6A00;color:#ffffff;text-decoration:none;font-weight:800;padding:13px 26px;border-radius:100px;font-size:14px;">${esc(btnText)}</a></p>` : ''}
</td></tr>
<tr><td style="padding:22px 28px 26px;color:#888;font-size:12px;line-height:1.6;border-top:1px solid #eee;">
AMPEX World Records · <a href="${esc(site)}" style="color:#888;">${esc(site.replace(/^https?:\/\//, ''))}</a><br>
${kind === 'marketing' && unsubscribe ? `You get these emails because you are an AMPEX member. <a href="${esc(unsubscribe)}" style="color:#888;">Unsubscribe from promotional emails</a>.` : 'This message is about your AMPEX World Records account.'}
</td></tr></table></td></tr></table></body></html>`;
  const plain = `${personalise(subject, member)}\n\n${text}${btnUrl ? `\n\n${btnText}: ${btnUrl}` : ''}\n\n--\nAMPEX World Records · ${site}${kind === 'marketing' && unsubscribe ? `\nUnsubscribe from promotional emails: ${unsubscribe}` : ''}`;
  return { subject: personalise(subject, member), html, text: plain };
};

module.exports = {
  emailEnabled, emailMode: mode, senderAddress, send, buildEmail, outbox,
  unsubscribeToken, checkUnsubscribeToken, unsubscribeUrl, safeLink,
};
