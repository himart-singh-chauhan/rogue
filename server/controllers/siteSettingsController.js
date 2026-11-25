// Small admin-editable site settings kept in system_settings (key → JSON text):
//   auth_page   the picture and title on the Login and Sign Up pages (Admin → Homepage Control)
//   ad_pricing  what sponsors pay for video ads (10 sec / 30 sec / 1 min) and banner spots (Admin → Sponsors & Ads)
// plus the public "Advertise with us" request form, which lands in the admin inbox.
const supabase = require('../config/supabase');
const { captchaProblem } = require('../utils/captcha');
const { notifyAdmins, siteUrl } = require('../utils/notify');

const text = (v, max) => String(v ?? '').trim().slice(0, max);
const url = (v) => { const s = text(v, 1000); return /^https?:\/\//i.test(s) || s.startsWith('/') ? s : ''; };
const money = (v) => { const n = Math.round(Number(v) * 100) / 100; return Number.isFinite(n) && n >= 0 && n <= 1000000 ? n : 0; };
const PERIODS = ['one_time', 'day', 'week', 'month', 'year'];
const period = (v, d = 'month') => (PERIODS.includes(v) ? v : d);

const readKey = async (key) => {
  const { data } = await supabase.from('system_settings').select('value').eq('key', key).maybeSingle();
  try { return data?.value ? JSON.parse(data.value) : null; } catch { return null; }
};
const writeKey = async (key, value) => {
  const { error } = await supabase.from('system_settings').upsert({ key, value: JSON.stringify(value), updated_at: new Date() }, { onConflict: 'key' });
  if (error) throw error;
};

// ---------------------------------------------------------------- Login / Sign Up page picture and title
const AUTH_DEFAULT = {
  loginImage: '', loginKicker: 'AMPEX WORLD RECORDS', loginTitle: 'PUSH\nBEYOND\nLIMITS',
  signupImage: '', signupTitle: 'JOIN THE\nELITE',
};
const cleanAuth = (b = {}) => ({
  loginImage: url(b.loginImage),
  loginKicker: text(b.loginKicker, 60),
  loginTitle: text(b.loginTitle, 80),
  signupImage: url(b.signupImage),
  signupTitle: text(b.signupTitle, 80),
});
const getAuthPage = async (req, res) => {
  try { res.json({ ...AUTH_DEFAULT, ...cleanAuth({ ...AUTH_DEFAULT, ...(await readKey('auth_page') || {}) }) }); }
  catch { res.json(AUTH_DEFAULT); }
};
const saveAuthPage = async (req, res) => {
  try {
    const value = cleanAuth(req.body || {});
    if (!value.loginTitle) value.loginTitle = AUTH_DEFAULT.loginTitle;
    if (!value.signupTitle) value.signupTitle = AUTH_DEFAULT.signupTitle;
    await writeKey('auth_page', value);
    res.json({ ...value, message: 'Login and Sign Up pages saved.' });
  } catch (e) { res.status(500).json({ message: 'Could not save', error: e.message }); }
};

// ---------------------------------------------------------------- Ad prices
const BANNER_SPOTS = [
  ['homepage_top_banner', 'Homepage top banner'],
  ['homepage', 'Homepage sponsor strip'],
  ['featured', 'Featured sponsor (homepage)'],
  ['records', 'Explore Records page'],
  ['record_page', "Each record's page"],
  ['rankings', 'Rankings / Leaderboards'],
  ['challenges', 'Challenge page'],
  ['profiles', 'Member profiles'],
  ['shop', 'Shop page'],
  ['livestream', 'Live stream banner'],
  ['video_overlay', 'Logo over the live stream'],
  ['footer_sponsor', 'Footer logo'],
];
const VIDEO_LENGTHS = [10, 30, 60];
const PRICING_DEFAULT = {
  currency: 'USD',
  video: VIDEO_LENGTHS.map((seconds) => ({ seconds, price: 0, period: 'month', enabled: true })),
  banners: BANNER_SPOTS.map(([placement]) => ({ placement, price: 0, period: 'month', enabled: true })),
  note: '',
};
const cleanPricing = (b = {}) => {
  const vid = Array.isArray(b.video) ? b.video : [];
  const ban = Array.isArray(b.banners) ? b.banners : [];
  return {
    currency: 'USD',
    video: VIDEO_LENGTHS.map((seconds) => {
      const v = vid.find((x) => Number(x?.seconds) === seconds) || {};
      return { seconds, price: money(v.price), period: period(v.period), enabled: v.enabled !== false };
    }),
    banners: BANNER_SPOTS.map(([placement]) => {
      const v = ban.find((x) => x?.placement === placement) || {};
      return { placement, price: money(v.price), period: period(v.period), enabled: v.enabled !== false };
    }),
    note: text(b.note, 1000),
  };
};
const readPricing = async () => cleanPricing({ ...PRICING_DEFAULT, ...(await readKey('ad_pricing') || {}) });
const withLabels = (p) => ({
  ...p,
  banners: p.banners.map((b) => ({ ...b, label: (BANNER_SPOTS.find(([k]) => k === b.placement) || [])[1] || b.placement })),
});
// Public: only the options switched on
const getAdPricing = async (req, res) => {
  try {
    const p = withLabels(await readPricing());
    res.json({ ...p, video: p.video.filter((v) => v.enabled), banners: p.banners.filter((b) => b.enabled) });
  } catch { res.status(500).json({ message: 'Could not load the ad prices' }); }
};
// Admin: everything
const getAdPricingAdmin = async (req, res) => {
  try { res.json(withLabels(await readPricing())); } catch { res.status(500).json({ message: 'Could not load the ad prices' }); }
};
const saveAdPricing = async (req, res) => {
  try {
    const value = cleanPricing(req.body || {});
    await writeKey('ad_pricing', value);
    res.json({ ...withLabels(value), message: 'Ad prices saved.' });
  } catch (e) { res.status(500).json({ message: 'Could not save the ad prices', error: e.message }); }
};

// ---------------------------------------------------------------- "Advertise with us" request
const EMAIL_RE = /^[^\s@,;<>()"]+@[^\s@,;<>()"]+\.[a-z]{2,}$/i;
const PERIOD_TEXT = { one_time: 'one time', day: 'per day', week: 'per week', month: 'per month', year: 'per year' };
const priceText = (o) => `$${Number(o.price || 0).toFixed(2)} ${PERIOD_TEXT[o.period] || ''}`.trim();
const adRequest = async (req, res) => {
  const b = req.body || {};
  const name = text(b.name, 120);
  const company = text(b.company, 160);
  const email = text(b.email, 200).toLowerCase();
  const phone = text(b.phone, 40);
  const website = text(b.website, 300);
  const message = text(b.message, 3000);
  const choices = Array.isArray(b.choices) ? b.choices.map((c) => text(c, 40)).slice(0, 20) : [];
  if (!name || !company) return res.status(400).json({ message: 'Please enter your name and company.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please enter a valid email address.' });
  if (!choices.length) return res.status(400).json({ message: 'Please choose at least one ad.' });
  const captcha = await captchaProblem(req);
  if (captcha) return res.status(400).json({ message: captcha, code: 'captcha_failed' });
  try {
    const p = withLabels(await readPricing());
    const lines = choices.map((c) => {
      const m = /^video_(\d+)$/.exec(c);
      if (m) { const v = p.video.find((x) => x.seconds === Number(m[1]) && x.enabled); return v ? `${v.seconds === 60 ? '1 minute' : `${v.seconds} second`} video ad: ${priceText(v)}` : null; }
      const bnr = p.banners.find((x) => x.placement === c && x.enabled);
      return bnr ? `Banner, ${bnr.label}: ${priceText(bnr)}` : null;
    }).filter(Boolean);
    if (!lines.length) return res.status(400).json({ message: 'Please choose at least one ad.' });
    const body = [
      `Company: ${company}`, `Name: ${name}`, `Email: ${email}`, phone ? `Phone: ${phone}` : null, website ? `Website: ${website}` : null,
      '', 'Wants:', ...lines.map((l) => `• ${l}`), message ? `\nMessage:\n${message}` : null,
    ].filter((l) => l !== null).join('\n');
    const subject = `Advertising request: ${company}`;
    const { error } = await supabase.from('contact_messages').insert([{ name: `${name} (${company})`, email, subject, message: body }]);
    if (error) throw error;
    await notifyAdmins({ subject, body: `${company} wants to advertise on AMPEX.\n\n${body}`, link: `${siteUrl()}/admin`, linkText: 'Open Sponsors & Ads' });
    res.status(201).json({ message: "Thanks! We received your request and will email you within 1–2 business days with the next steps." });
  } catch (e) {
    console.error('Ad request error:', e.message);
    res.status(500).json({ message: 'Could not send your request. Please email partners@ampexworldrecords.com.' });
  }
};

module.exports = { getAuthPage, saveAuthPage, getAdPricing, getAdPricingAdmin, saveAdPricing, adRequest, BANNER_SPOTS, VIDEO_LENGTHS };
