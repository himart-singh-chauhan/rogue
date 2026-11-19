// Email verification after sign-up: a signed link (no extra table) that is valid for 7 days and only for the
// address it was sent to, so changing the email on the account makes old links stop working.
const crypto = require('crypto');
const supabase = require('../config/supabase');
const email = require('./email');
const { siteUrl } = require('./notify');

const DAYS = 7;
const RESEND_GAP_MS = 60 * 1000;
const secret = () => process.env.JWT_SECRET || 'ampex-verify';
const sign = (userId, address, exp) => crypto.createHmac('sha256', secret()).update(`verify-email:${userId}:${String(address).toLowerCase()}:${exp}`).digest('hex').slice(0, 40);

const makeToken = (userId, address) => {
  const exp = Date.now() + DAYS * 24 * 3600 * 1000;
  return `${userId}.${exp.toString(36)}.${sign(userId, address, exp)}`;
};

// Returns { userId } or { error }
const readToken = async (token) => {
  const [userId, exp36, sig] = String(token || '').split('.');
  const exp = parseInt(exp36, 36);
  if (!userId || !exp || !sig) return { error: 'This verification link is incomplete. Please use the newest email we sent you.' };
  const { data: user } = await supabase.from('users').select('id, email, email_verified_at').eq('id', userId).maybeSingle();
  if (!user) return { error: 'This verification link is not valid.' };
  const good = sign(user.id, user.email, exp);
  if (good.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig))) {
    return { error: 'This verification link is not valid. If you changed your email address, use the newest email we sent you.' };
  }
  if (user.email_verified_at) return { userId: user.id, email: user.email, already: true };
  if (exp < Date.now()) return { error: 'This verification link has expired. Log in and send yourself a new one from your profile.' };
  return { userId: user.id, email: user.email };
};

/**
 * Send (or re-send) the verification email. Never throws: a sign-up must not fail because email is down.
 * Returns 'sent' | 'already' | 'wait' | 'off' | 'failed'.
 */
const sendVerification = async (user, { force = false } = {}) => {
  try {
    if (!user?.id || !user.email) return 'failed';
    if (user.email_verified_at) return 'already';
    if (!email.emailEnabled()) return 'off';
    if (!force && user.verification_sent_at && Date.now() - new Date(user.verification_sent_at).getTime() < RESEND_GAP_MS) return 'wait';
    const link = `${siteUrl()}/verify-email?token=${encodeURIComponent(makeToken(user.id, user.email))}`;
    const msg = email.buildEmail({
      subject: 'Please verify your email address',
      body: `Welcome to AMPEX World Records!\n\nPlease confirm that this is your email address by clicking the button below. The link works for ${DAYS} days.\n\nIf you didn't create an AMPEX account, you can ignore this email.`,
      buttonText: 'Verify my email',
      buttonUrl: link,
      member: user,
      kind: 'account',
    });
    await email.send({ to: user.email, subject: msg.subject, html: msg.html, text: msg.text });
    await supabase.from('users').update({ verification_sent_at: new Date().toISOString() }).eq('id', user.id);
    return 'sent';
  } catch (e) {
    console.warn('[Verify email] could not send:', e.message);
    return 'failed';
  }
};

module.exports = { makeToken, readToken, sendVerification, RESEND_GAP_MS };
