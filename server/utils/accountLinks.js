// Signed links for account emails (no extra tables):
//  - password reset: valid 1 hour, and only until the password changes (the link is tied to the current hash)
//  - parent/guardian approval for a member under 18: valid 14 days, tied to the guardian's address
const crypto = require('crypto');
const supabase = require('../config/supabase');
const email = require('./email');
const { siteUrl } = require('./notify');

const secret = () => process.env.JWT_SECRET || 'ampex-links';
const hmac = (s) => crypto.createHmac('sha256', secret()).update(s).digest('hex').slice(0, 40);
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const parse = (token) => { const [id, exp36, sig] = String(token || '').split('.'); const exp = parseInt(exp36, 36); return id && exp && sig ? { id, exp, sig } : null; };
const RESEND_GAP_MS = 60 * 1000;

// ---------------- password reset ----------------
const resetSig = (user, exp) => hmac(`reset:${user.id}:${exp}:${String(user.password || '').slice(-24)}`);
const makeResetToken = (user) => { const exp = Date.now() + 60 * 60 * 1000; return `${user.id}.${exp.toString(36)}.${resetSig(user, exp)}`; };

/** Returns { user } (with password hash) or { error } */
const readResetToken = async (token) => {
  const t = parse(token);
  if (!t) return { error: 'This reset link is incomplete. Please request a new one.' };
  const { data: user } = await supabase.from('users').select('id, email, name, password, account_status').eq('id', t.id).maybeSingle();
  if (!user || !same(resetSig(user, t.exp), t.sig)) return { error: 'This reset link is not valid or was already used. Please request a new one.' };
  if (t.exp < Date.now()) return { error: 'This reset link has expired. Please request a new one.' };
  return { user };
};

const sendPasswordReset = async (user) => {
  if (!email.emailEnabled()) return 'off';
  if (user.password_reset_sent_at && Date.now() - new Date(user.password_reset_sent_at).getTime() < RESEND_GAP_MS) return 'wait';
  const link = `${siteUrl()}/reset-password?token=${encodeURIComponent(makeResetToken(user))}`;
  const msg = email.buildEmail({
    subject: 'Reset your AMPEX World Records password',
    body: 'We received a request to reset the password for your AMPEX World Records account.\n\nClick the button below to choose a new password. The link works for 1 hour and only once.\n\nIf you didn\'t ask for this, you can ignore this email: your password stays the same.',
    buttonText: 'Choose a new password', buttonUrl: link, member: user, kind: 'account',
  });
  await email.send({ to: user.email, subject: msg.subject, html: msg.html, text: msg.text });
  await supabase.from('users').update({ password_reset_sent_at: new Date().toISOString() }).eq('id', user.id);
  return 'sent';
};

// ---------------- parent / guardian approval ----------------
const guardianSig = (user, exp) => hmac(`guardian:${user.id}:${String(user.guardian_email || '').toLowerCase()}:${exp}`);
const makeGuardianToken = (user) => { const exp = Date.now() + 14 * 24 * 3600 * 1000; return `${user.id}.${exp.toString(36)}.${guardianSig(user, exp)}`; };

const readGuardianToken = async (token) => {
  const t = parse(token);
  if (!t) return { error: 'This approval link is incomplete.' };
  const { data: user } = await supabase.from('users').select('id, name, email, account_status, guardian_name, guardian_email, guardian_verified_at').eq('id', t.id).maybeSingle();
  if (!user || !user.guardian_email || !same(guardianSig(user, t.exp), t.sig)) return { error: 'This approval link is not valid.' };
  if (user.guardian_verified_at) return { user, already: true };
  if (t.exp < Date.now()) return { error: 'This approval link has expired. Please contact AMPEX World Records support.' };
  return { user };
};

const sendGuardianApproval = async (user, { force = false } = {}) => {
  try {
    if (!user?.guardian_email || !email.emailEnabled()) return 'off';
    if (!force && user.guardian_email_sent_at && Date.now() - new Date(user.guardian_email_sent_at).getTime() < RESEND_GAP_MS) return 'wait';
    const link = `${siteUrl()}/guardian-approve?token=${encodeURIComponent(makeGuardianToken(user))}`;
    const msg = email.buildEmail({
      subject: `Please approve ${user.name || 'your child'}'s AMPEX World Records account`,
      body: `${user.name || 'Your child'} (${user.email}) has signed up for AMPEX World Records and named you as their parent or legal guardian.\n\nMembers under 18 need a parent or legal guardian, who is at least 18 years old, to approve and manage their account. The account stays closed until you approve it.\n\nBy approving, you confirm that you are this member's parent or legal guardian, that you are at least 18, and that you will manage this account. Providing false age or guardian information may result in account suspension and the revocation of any records earned through the account.\n\nIf you don't know about this account, ignore this email and it will not be activated.`,
      buttonText: 'I am the parent/guardian: approve the account', buttonUrl: link,
      member: { name: user.guardian_name || 'Parent or Guardian' }, kind: 'account',
    });
    await email.send({ to: user.guardian_email, subject: msg.subject, html: msg.html, text: msg.text });
    await supabase.from('users').update({ guardian_email_sent_at: new Date().toISOString() }).eq('id', user.id);
    return 'sent';
  } catch (e) {
    console.warn('[Guardian email] could not send:', e.message);
    return 'failed';
  }
};

module.exports = { makeResetToken, readResetToken, sendPasswordReset, makeGuardianToken, readGuardianToken, sendGuardianApproval };
