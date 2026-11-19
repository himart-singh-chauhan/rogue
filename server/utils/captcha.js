// CAPTCHA on sign-up and sign-in: Cloudflare Turnstile in "managed" mode, which only asks a person to do
// something when their visit looks suspicious. The browser gets a one-time token; the server checks it here
// before creating an account or logging anyone in.
// Off until TURNSTILE_SECRET_KEY is set on the API (and VITE_TURNSTILE_SITE_KEY on the website).
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const captchaEnabled = () => !!String(process.env.TURNSTILE_SECRET_KEY || '').trim();

const clientIp = (req) => String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';

/**
 * Returns null when the check passes (or CAPTCHA is off), otherwise the message to show the visitor.
 * Fails closed: if Cloudflare can't be reached, the visitor is asked to try again.
 */
const captchaProblem = async (req) => {
  if (!captchaEnabled()) return null;
  const token = String(req.body?.captchaToken || '').trim();
  if (!token) return 'Please complete the security check, then try again.';
  try {
    const form = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY.trim(), response: token });
    const ip = clientIp(req);
    if (ip) form.append('remoteip', ip);
    const r = await fetch(VERIFY_URL, { method: 'POST', body: form, signal: AbortSignal.timeout(8000) });
    const data = await r.json().catch(() => ({}));
    if (data.success) return null;
    const codes = data['error-codes'] || [];
    if (codes.includes('timeout-or-duplicate')) return 'The security check expired. Please try again.';
    return 'The security check did not pass. Please try again.';
  } catch (e) {
    console.warn('[Captcha] could not reach Cloudflare:', e.message);
    return 'We could not complete the security check. Please try again in a moment.';
  }
};

module.exports = { captchaEnabled, captchaProblem };
