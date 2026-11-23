// CAPTCHA on sign-up, sign-in and password reset. The browser gets a one-time token; the server checks it here
// before creating an account or logging anyone in.
//  - Google reCAPTCHA v2 ("I'm not a robot" checkbox, shown every time): RECAPTCHA_SECRET_KEY on the API and
//    VITE_RECAPTCHA_SITE_KEY on the website. Used whenever it is set.
//  - otherwise Cloudflare Turnstile (only asks when a visit looks suspicious): TURNSTILE_SECRET_KEY /
//    VITE_TURNSTILE_SITE_KEY.
// With neither set, there is no CAPTCHA.
const RECAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify';
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const recaptchaSecret = () => String(process.env.RECAPTCHA_SECRET_KEY || '').trim();
const turnstileSecret = () => String(process.env.TURNSTILE_SECRET_KEY || '').trim();
const captchaEnabled = () => !!(recaptchaSecret() || turnstileSecret());

const clientIp = (req) => String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';

/**
 * Returns null when the check passes (or CAPTCHA is off), otherwise the message to show the visitor.
 * Fails closed: if the CAPTCHA service can't be reached, the visitor is asked to try again.
 */
const captchaProblem = async (req) => {
  if (!captchaEnabled()) return null;
  const google = !!recaptchaSecret();
  const token = String(req.body?.captchaToken || '').trim();
  if (!token) return google ? 'Please tick "I\'m not a robot", then try again.' : 'Please complete the security check, then try again.';
  try {
    const form = new URLSearchParams({ secret: google ? recaptchaSecret() : turnstileSecret(), response: token });
    const ip = clientIp(req);
    if (ip) form.append('remoteip', ip);
    const r = await fetch(google ? RECAPTCHA_URL : TURNSTILE_URL, { method: 'POST', body: form, signal: AbortSignal.timeout(8000) });
    const data = await r.json().catch(() => ({}));
    if (data.success) return null;
    const codes = data['error-codes'] || [];
    if (codes.includes('timeout-or-duplicate')) return 'The security check expired. Please tick it again and retry.';
    return 'The security check did not pass. Please try again.';
  } catch (e) {
    console.warn('[Captcha] could not reach the CAPTCHA service:', e.message);
    return 'We could not complete the security check. Please try again in a moment.';
  }
};

module.exports = { captchaEnabled, captchaProblem };
