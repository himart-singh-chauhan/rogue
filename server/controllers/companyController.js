// Company details and social media links, set by the admin (Admin → System → Company & social links) and
// shown on About, Contact and in the footer. Anything left empty is simply not shown.
const supabase = require('../config/supabase');
const { safeLink } = require('../utils/email');

const KEY = 'company_profile';
const DEFAULTS = {
  companyName: '', founderName: '', founderTitle: '', founderBio: '', verificationTeam: '', serviceRegion: '', address: '',
  emails: { support: 'support@ampexworldrecords.com', submissions: 'submissions@ampexworldrecords.com', records: 'records@ampexworldrecords.com', sales: 'sales@ampexworldrecords.com', partners: 'partners@ampexworldrecords.com' },
  social: { facebook: '', instagram: '', tiktok: '', youtube: '', x: '' },
};
const EMAIL_RE = /^[^\s@,;<>()"]+@[^\s@,;<>()"]+\.[a-z]{2,}$/i;
const text = (v, max) => String(v ?? '').trim().slice(0, max);

const clean = (raw = {}) => {
  const emails = {};
  for (const k of Object.keys(DEFAULTS.emails)) {
    const v = text(raw.emails?.[k], 200).toLowerCase();
    emails[k] = v && EMAIL_RE.test(v) ? v : '';
  }
  const social = {};
  for (const k of Object.keys(DEFAULTS.social)) {
    const v = text(raw.social?.[k], 300);
    // 'instagram.com/ampex' is fine too
    const full = v && !/^https?:\/\//i.test(v) && /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(v) ? 'https://' + v : v;
    social[k] = full && /^https:\/\//i.test(full) ? safeLink(full) || '' : '';
  }
  return {
    companyName: text(raw.companyName, 120), founderName: text(raw.founderName, 120), founderTitle: text(raw.founderTitle, 120),
    founderBio: text(raw.founderBio, 10000), verificationTeam: text(raw.verificationTeam, 4000), serviceRegion: text(raw.serviceRegion, 200),
    address: text(raw.address, 300), emails, social,
  };
};

const read = async () => {
  const { data } = await supabase.from('system_settings').select('value').eq('key', KEY).maybeSingle();
  let stored = null;
  try { stored = data?.value ? JSON.parse(data.value) : null; } catch { stored = null; }
  return stored ? clean({ ...DEFAULTS, ...stored, emails: { ...DEFAULTS.emails, ...(stored.emails || {}) }, social: { ...DEFAULTS.social, ...(stored.social || {}) } }) : clean(DEFAULTS);
};

// GET /api/settings/company (public)
const getCompany = async (req, res) => {
  try { res.json(await read()); } catch (e) { res.status(500).json({ message: 'Could not load the company details' }); }
};

// PUT /api/admin/company-profile (admin)
const saveCompany = async (req, res) => {
  try {
    const value = clean(req.body || {});
    const { error } = await supabase.from('system_settings').upsert({ key: KEY, value: JSON.stringify(value), updated_at: new Date() }, { onConflict: 'key' });
    if (error) throw error;
    await supabase.from('audit_logs').insert({ actor_id: req.user.id, action_type: 'update_company_profile', metadata: { companyName: value.companyName } });
    res.json({ ...value, message: 'Company details saved.' });
  } catch (e) {
    res.status(500).json({ message: 'Could not save the company details', error: e.message });
  }
};

module.exports = { getCompany, saveCompany };
