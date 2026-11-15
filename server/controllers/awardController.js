// Achievement awards: custom awards made in Admin → Achievement Awards and given to members.
// They are separate from World Record certificates: their own design, their own numbers (AWD-…).
// Only published awards show on member profiles.
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { notifyMember, siteUrl } = require('../utils/notify');
const auto = require('../utils/autoAwards');

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const url = (v) => { const s = clean(v, 1000); return s && (/^https?:\/\//i.test(s) || s.startsWith('/')) ? s : null; };
const COLOR = /^#[0-9a-f]{6}$/i;

const readAward = (b, existing = {}) => {
  const pick = (k, fn) => (b[k] !== undefined ? fn(b[k]) : existing[k]);
  return {
    title: pick('title', (v) => clean(v, 120)),
    description: pick('description', (v) => clean(v, 1200)),
    icon: pick('icon', (v) => clean(v, 16) || '🏆'),
    image_url: pick('image_url', url),
    background_url: pick('background_url', url),
    orientation: pick('orientation', (v) => (v === 'portrait' ? 'portrait' : 'landscape')),
    color: pick('color', (v) => (COLOR.test(String(v)) ? String(v) : '#FF6A00')),
    signer1_name: pick('signer1_name', (v) => clean(v, 80)),
    signer1_title: pick('signer1_title', (v) => clean(v, 80)),
    signer1_signature_url: pick('signer1_signature_url', url),
    signer2_name: pick('signer2_name', (v) => clean(v, 80)),
    signer2_title: pick('signer2_title', (v) => clean(v, 80)),
    signer2_signature_url: pick('signer2_signature_url', url),
    status: pick('status', (v) => (v === 'published' ? 'published' : 'draft')),
    design: pick('design', (v) => (['template', 'artwork', 'classic'].includes(v) ? v : 'template')),
    criteria: pick('criteria', (v) => (auto.CRITERIA[v] ? v : 'manual')),
    criteria_value: pick('criteria_value', (v) => { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 && n < 1000 ? n : null; }),
    sort_order: pick('sort_order', (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 100; }),
  };
};
const withCriteria = (a) => ({ ...a, criteria_label: auto.criteriaLabel(a.criteria || 'manual', a.criteria_value) });
const designError = (row) => (row.design === 'artwork' && !row.background_url ? 'Upload the award artwork (or choose the AMPEX award design).' : null);

// GET /api/admin/awards
const listAwards = async (req, res) => {
  const { data, error } = await supabase.from('achievement_awards').select('*, given:member_awards(count)').order('sort_order', { ascending: true }).order('created_at', { ascending: true });
  if (error) {
    const missing = /schema cache|does not exist|sort_order/i.test(error.message);
    return res.status(500).json({ message: missing ? 'The awards tables are not in the database yet: run the 2026-11-14 and 2026-11-16 migrations in Supabase.' : 'Could not load awards', error: error.message });
  }
  res.json((data || []).map((a) => withCriteria({ ...a, given_count: a.given?.[0]?.count || 0, given: undefined })));
};

// POST /api/admin/awards
const createAward = async (req, res) => {
  const row = readAward(req.body || {});
  if (!row.title) return res.status(400).json({ message: 'Give the award a title.' });
  const bad = designError(row); if (bad) return res.status(400).json({ message: bad });
  const { data, error } = await supabase.from('achievement_awards').insert({ ...row, created_by: req.user.id }).select('*').single();
  if (error) return res.status(500).json({ message: 'Could not save the award', error: error.message });
  const granted = data.status === 'published' && data.criteria !== 'manual' ? await auto.syncQuietly({}) : [];
  res.status(201).json({ ...withCriteria(data), granted: granted.length });
};

// PUT /api/admin/awards/:id
const updateAward = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Award not found' });
  const { data: existing } = await supabase.from('achievement_awards').select('*').eq('id', req.params.id).maybeSingle();
  if (!existing) return res.status(404).json({ message: 'Award not found' });
  const row = readAward(req.body || {}, existing);
  if (!row.title) return res.status(400).json({ message: 'Give the award a title.' });
  const bad = designError(row); if (bad) return res.status(400).json({ message: bad });
  const { data, error } = await supabase.from('achievement_awards').update({ ...row, updated_at: new Date().toISOString() }).eq('id', req.params.id).select('*').single();
  if (error) return res.status(500).json({ message: 'Could not save the award', error: error.message });
  const granted = data.status === 'published' && data.criteria !== 'manual' ? await auto.syncQuietly({}) : [];
  res.json({ ...withCriteria(data), granted: granted.length });
};

// DELETE /api/admin/awards/:id  (also takes it off every member it was given to)
const deleteAward = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Award not found' });
  const { error } = await supabase.from('achievement_awards').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: 'Could not delete the award', error: error.message });
  await supabase.from('audit_logs').insert({ actor_id: req.user.id, action_type: 'delete_award', metadata: { award: req.params.id } }).then(() => {}, () => {});
  res.json({ ok: true });
};

// GET /api/admin/awards/:id/members
const listAssignments = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Award not found' });
  const { data, error } = await supabase.from('member_awards')
    .select('id, award_number, award_date, recipient_name, title_override, description_override, auto, created_at, user:user_id(id, name, username, email, member_number)')
    .eq('award_id', req.params.id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ message: 'Could not load members', error: error.message });
  res.json(data || []);
};

const newAwardNumber = () => `AWD-${new Date().getUTCFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// POST /api/admin/awards/:id/assign { userId, awardDate?, recipientName?, title?, description? }
const assignAward = async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  if (!isUUID(id)) return res.status(404).json({ message: 'Award not found' });
  if (!isUUID(b.userId)) return res.status(400).json({ message: 'Choose a member.' });
  const [{ data: award }, { data: user }] = await Promise.all([
    supabase.from('achievement_awards').select('id, title, status').eq('id', id).maybeSingle(),
    supabase.from('users').select('id, name, username').eq('id', b.userId).maybeSingle(),
  ]);
  if (!award) return res.status(404).json({ message: 'Award not found' });
  if (!user) return res.status(404).json({ message: 'Member not found' });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.awardDate || '')) ? b.awardDate : new Date().toISOString().slice(0, 10);
  // (an admin can also give an automatic award by hand, e.g. for an achievement made outside the site)
  const row = {
    award_id: id, user_id: user.id, award_date: date,
    recipient_name: clean(b.recipientName, 120) || user.name,
    title_override: clean(b.title, 120) || null,
    description_override: clean(b.description, 1200) || null,
    created_by: req.user.id,
  };
  let data; let error;
  for (let i = 0; i < 3; i += 1) {
    ({ data, error } = await supabase.from('member_awards').insert({ ...row, award_number: newAwardNumber() }).select('*').single());
    if (!error || error.code !== '23505') break;
  }
  if (error) return res.status(500).json({ message: 'Could not give the award', error: error.message });
  if (award.status === 'published') {
    await notifyMember({
      userId: user.id, senderId: req.user.id,
      subject: `You received an award: ${row.title_override || award.title}`,
      body: `Congratulations! AMPEX World Records has given you the "${row.title_override || award.title}" award.\n\nYou can see it and print it on your profile under Achievements: ${siteUrl()}/profile/${user.username || ''}`,
    });
  }
  res.status(201).json(data);
};

// PUT /api/admin/member-awards/:id
const updateAssignment = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const b = req.body || {};
  const patch = {};
  if (b.awardDate !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(String(b.awardDate))) patch.award_date = b.awardDate;
  if (b.recipientName !== undefined) patch.recipient_name = clean(b.recipientName, 120) || null;
  if (b.title !== undefined) patch.title_override = clean(b.title, 120) || null;
  if (b.description !== undefined) patch.description_override = clean(b.description, 1200) || null;
  const { data, error } = await supabase.from('member_awards').update(patch).eq('id', req.params.id).select('*').single();
  if (error) return res.status(500).json({ message: 'Could not save', error: error.message });
  res.json(data);
};

// DELETE /api/admin/member-awards/:id
const removeAssignment = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const { error } = await supabase.from('member_awards').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: 'Could not remove the award', error: error.message });
  res.json({ ok: true });
};

// The award as the profile and the PDF need it (member-specific title / description win)
const shape = (row) => {
  const a = row.award || {};
  return {
    id: row.id,
    awardId: a.id,
    awardNumber: row.award_number,
    date: row.award_date,
    recipientName: row.recipient_name,
    title: row.title_override || a.title,
    description: row.description_override || a.description,
    icon: a.icon, imageUrl: a.image_url, backgroundUrl: a.background_url, orientation: a.orientation, color: a.color,
    design: a.design || 'classic', criteria: a.criteria || 'manual', criteriaLabel: auto.criteriaLabel(a.criteria || 'manual', a.criteria_value),
    auto: !!row.auto,
    signers: [
      { name: a.signer1_name, title: a.signer1_title, signatureUrl: a.signer1_signature_url },
      { name: a.signer2_name, title: a.signer2_title, signatureUrl: a.signer2_signature_url },
    ].filter((s) => s.name || s.signatureUrl),
  };
};

// GET /api/awards/user/:userId  (public: published awards of one member; gives any automatic award they now qualify for)
const awardsForUser = async (req, res) => {
  if (!isUUID(req.params.userId)) return res.json([]);
  await auto.syncQuietly({ userId: req.params.userId });
  const { data, error } = await supabase.from('member_awards')
    .select('id, award_number, award_date, recipient_name, title_override, description_override, auto, award:award_id!inner(*)')
    .eq('user_id', req.params.userId)
    .eq('award.status', 'published')
    .order('award_date', { ascending: false });
  if (error) {
    if (/relation .* does not exist|Could not find/i.test(error.message)) return res.json([]); // before the migration
    return res.status(500).json({ message: 'Could not load awards', error: error.message });
  }
  res.json((data || []).map(shape));
};

// GET /api/awards/catalog  (public: every published award and how to earn it, for the profile Achievements tab)
const catalog = async (req, res) => {
  const { data, error } = await supabase.from('achievement_awards')
    .select('id, slug, title, description, icon, image_url, background_url, design, color, criteria, criteria_value, sort_order')
    .eq('status', 'published').order('sort_order', { ascending: true }).order('created_at', { ascending: true });
  if (error) {
    if (/schema cache|does not exist|sort_order|design/i.test(error.message)) return res.json([]); // before the migration
    return res.status(500).json({ message: 'Could not load awards', error: error.message });
  }
  res.json((data || []).map(withCriteria));
};

// POST /api/admin/awards/sync  (admin: give automatic awards to everyone who qualifies now)
const syncNow = async (req, res) => {
  try {
    const granted = await auto.syncAutoAwards({});
    res.json({ granted: granted.length, list: granted, message: granted.length ? `${granted.length} ${granted.length === 1 ? 'award' : 'awards'} given to members who qualify.` : 'Everyone who qualifies already has their awards.' });
  } catch (e) {
    res.status(500).json({ message: 'Could not check the automatic awards', error: e.message });
  }
};

// GET /api/admin/awards/criteria  (choices for the award editor)
const criteriaOptions = (req, res) => res.json(Object.keys(auto.CRITERIA).map((key) => ({
  value: key, label: auto.criteriaLabel(key, null), needsNumber: ['pro_competitor', 'first_place', 'top_10', 'certified'].includes(key),
})));

module.exports = {
  catalog, syncNow, criteriaOptions,
  listAwards, createAward, updateAward, deleteAward, listAssignments, assignAward, updateAssignment, removeAssignment,
  awardsForUser, shapeAward: shape,
};
