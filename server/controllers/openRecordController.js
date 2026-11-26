// Try These Records: record ideas with no AMPEX holder yet. Members attempt one; the first attempt that is
// verified by an adjudicator becomes the original record (see onRecordVerified), and from then on it is a
// normal record that others can challenge.
const supabase = require('../config/supabase');
const { notifyMember } = require('../utils/notify');

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
const MEASUREMENTS = ['time', 'weight', 'repetitions', 'distance', 'score', 'other'];
const DIFFICULTIES = ['easy', 'medium', 'hard', 'extreme'];
const STATUSES = ['draft', 'open', 'paused', 'set', 'removed']; // removed = archived (hidden from the public, kept in admin)
const SCORINGS = ['most', 'longest', 'fastest'];
const RULES_KEY = 'open_records_general_rules';
const RECENT_DAYS = 60; // "recently set" records stay on the page this long
const text = (v, max) => String(v ?? '').trim().slice(0, max);
// Each section is numbered on its own, from 1, in page order (Curtis, Nov 26): "Record Challenge 05",
// "Funny Talent Challenge 05". Drafts and archived challenges have no number until they are published.
const NUMBERED = ['open', 'paused', 'set'];
const sectionLabel = (section) => (section ? String(section).replace(/s$/i, '') : 'Challenge');
const codeOf = (o, n = o.sectionNumber) => (n ? `${sectionLabel(o.section)} ${String(n).padStart(2, '0')}` : `AMPEX-OR-${String(o.id).slice(0, 8).toUpperCase()}`);
const pageOrder = (a, b) => ((a.sort_order ?? Infinity) - (b.sort_order ?? Infinity)) || ((a.number ?? Infinity) - (b.number ?? Infinity)) || (new Date(b.created_at) - new Date(a.created_at));
const sectionNumbers = async () => {
  const { data } = await supabase.from('open_records').select('id, section, sort_order, number, created_at, status').in('status', NUMBERED).limit(1000);
  const next = {}; const map = {};
  (data || []).sort(pageOrder).forEach((o) => { const k = o.section || ''; next[k] = (next[k] || 0) + 1; map[o.id] = next[k]; });
  return map;
};

const shape = (o, { attempts = 0, holder = null, sectionNumber = null } = {}) => ({
  id: o.id, code: codeOf(o, sectionNumber), sectionNumber, number: o.number ?? null, section: o.section || null, scoring: o.scoring || null, timeLimit: o.time_limit || null, sortOrder: o.sort_order ?? null,
  title: o.title, category: o.category, subcategory: o.subcategory,
  description: o.description, rules: o.rules, measurement: o.measurement, measurementUnit: o.measurement_unit,
  evidence: o.evidence, divisions: o.divisions || [], eligibility: o.eligibility || 'Worldwide', difficulty: o.difficulty,
  safety: o.safety, points: o.points || 0, deadline: o.deadline, status: o.status, recordId: o.record_id, setAt: o.set_at,
  createdAt: o.created_at, updatedAt: o.updated_at, attempts, holder,
});

// attempts per open record, and the holder of each record that has been set
const enrich = async (rows) => {
  const ids = rows.map((o) => o.id);
  const recIds = rows.map((o) => o.record_id).filter(Boolean);
  const [{ data: tries }, { data: holders }, numbers] = await Promise.all([
    ids.length ? supabase.from('records').select('open_record_id').in('open_record_id', ids) : { data: [] },
    recIds.length ? supabase.from('records').select('id, value, unit, verified_at, country, user:user_id(name, username, country)').in('id', recIds) : { data: [] },
    sectionNumbers(),
  ]);
  const count = {};
  (tries || []).forEach((t) => { count[t.open_record_id] = (count[t.open_record_id] || 0) + 1; });
  const byId = Object.fromEntries((holders || []).map((h) => [h.id, h]));
  return rows.map((o) => {
    const h = o.record_id ? byId[o.record_id] : null;
    return shape(o, {
      sectionNumber: numbers[o.id] || null,
      attempts: count[o.id] || 0,
      holder: h ? { name: h.user?.name || 'Athlete', username: h.user?.username || null, country: h.country || h.user?.country || null, value: h.value, unit: h.unit, verifiedAt: h.verified_at } : null,
    });
  });
};

// GET /api/open-records  (public: open + recently set; admins with ?all=1 see everything)
const list = async (req, res) => {
  try {
    const all = req.user?.is_admin && req.query.all === '1';
    let q = supabase.from('open_records').select('*')
      .order('sort_order', { ascending: true, nullsFirst: false }).order('number', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }).limit(500);
    if (!all) q = q.in('status', ['open', 'set']);
    const { data, error } = await q;
    if (error) throw error;
    const cutoff = Date.now() - RECENT_DAYS * 24 * 3600 * 1000;
    const rows = all ? data || [] : (data || []).filter((o) => o.status === 'open' || (o.set_at && new Date(o.set_at).getTime() > cutoff));
    res.json(await enrich(rows));
  } catch (e) {
    res.status(500).json({ message: 'Could not load the open records', error: e.message });
  }
};

// GET /api/open-records/:id
const getOne = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Record not found' });
  try {
    const { data: o } = await supabase.from('open_records').select('*').eq('id', req.params.id).maybeSingle();
    if (!o || (!req.user?.is_admin && ['draft', 'removed'].includes(o.status))) return res.status(404).json({ message: 'Record not found' });
    const [one] = await enrich([o]);
    res.json(one);
  } catch (e) {
    res.status(500).json({ message: 'Could not load the record', error: e.message });
  }
};

const readBody = (b = {}) => {
  const out = {
    title: text(b.title, 160), category: text(b.category, 80) || null, subcategory: text(b.subcategory, 80) || null,
    description: text(b.description, 4000) || null, rules: text(b.rules, 8000) || null,
    measurement: MEASUREMENTS.includes(b.measurement) ? b.measurement : 'other', measurement_unit: text(b.measurementUnit, 40) || null,
    evidence: text(b.evidence, 4000) || null,
    divisions: (Array.isArray(b.divisions) ? b.divisions : String(b.divisions || '').split(',')).map((d) => text(d, 60)).filter(Boolean).slice(0, 20),
    eligibility: text(b.eligibility, 80) || 'Worldwide',
    difficulty: DIFFICULTIES.includes(b.difficulty) ? b.difficulty : 'medium',
    safety: text(b.safety, 4000) || null,
    points: Math.max(0, Math.min(1000000, parseInt(b.points, 10) || 0)),
    deadline: b.deadline ? new Date(b.deadline).toISOString() : null,
    section: text(b.section, 80) || null,
    scoring: SCORINGS.includes(b.scoring) ? b.scoring : null,
    time_limit: text(b.timeLimit, 60) || null,
  };
  if (b.number !== undefined) out.number = b.number === '' || b.number == null ? null : Math.max(1, Math.min(9999, parseInt(b.number, 10) || 0)) || null;
  if (b.status !== undefined && STATUSES.includes(b.status) && b.status !== 'set') out.status = b.status;
  return out;
};

// POST /api/admin/open-records
const create = async (req, res) => {
  const body = readBody(req.body);
  if (body.title.length < 3) return res.status(400).json({ message: 'Give the record a title.' });
  try {
    // a new challenge goes at the end of the list
    const { data: last } = await supabase.from('open_records').select('sort_order').not('sort_order', 'is', null).order('sort_order', { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await supabase.from('open_records').insert({ ...body, sort_order: (Number(last?.sort_order) || 0) + 10, status: body.status || 'draft', created_by: req.user.id }).select('*').single();
    if (error) { if (error.code === '23505') return res.status(400).json({ message: 'Another challenge already uses that number.' }); throw error; }
    const [one] = await enrich([data]);
    res.status(201).json(one);
  } catch (e) {
    res.status(500).json({ message: 'Could not create the record', error: e.message });
  }
};

// PUT /api/admin/open-records/:id
const update = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Record not found' });
  const body = readBody(req.body);
  if (body.title.length < 3) return res.status(400).json({ message: 'Give the record a title.' });
  try {
    const { data: current } = await supabase.from('open_records').select('status').eq('id', req.params.id).maybeSingle();
    if (!current) return res.status(404).json({ message: 'Record not found' });
    if (current.status === 'set') delete body.status; // a set record stays set (its holder is chosen below)
    const { data, error } = await supabase.from('open_records').update({ ...body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select('*').single();
    if (error) { if (error.code === '23505') return res.status(400).json({ message: 'Another challenge already uses that number.' }); throw error; }
    const [one] = await enrich([data]);
    res.json(one);
  } catch (e) {
    res.status(500).json({ message: 'Could not save the record', error: e.message });
  }
};

// GET /api/admin/open-records/:id/attempts — everyone attempting it
const attempts = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Record not found' });
  try {
    const { data, error } = await supabase.from('records')
      .select('id, title, value, unit, status, created_at, verified_at, evidence_url, user:user_id(id, name, email, username, country)')
      .eq('open_record_id', req.params.id).order('created_at', { ascending: true });
    if (error) throw error;
    res.json((data || []).map((r) => ({ id: r.id, value: r.value, unit: r.unit, status: r.status, createdAt: r.created_at, verifiedAt: r.verified_at, evidenceUrl: r.evidence_url, member: r.user })));
  } catch (e) {
    res.status(500).json({ message: 'Could not load the attempts', error: e.message });
  }
};

/**
 * Make a verified attempt the original record: the open record becomes "set", and the other attempts still
 * waiting for review are turned into challenges against the new record (their members are told).
 */
const markSet = async (openRecordId, record, { adminId = null } = {}) => {
  const now = new Date().toISOString();
  const { data: o } = await supabase.from('open_records').update({ status: 'set', record_id: record.id, set_at: now, updated_at: now })
    .eq('id', openRecordId).select('*').maybeSingle();
  if (!o) return null;
  const { data: others } = await supabase.from('records').select('id, user_id, status')
    .eq('open_record_id', openRecordId).neq('id', record.id).in('status', ['pending', 'under_review', 'pending_review', 'needs_info']);
  for (const r of others || []) {
    if (String(r.user_id) === String(record.user_id)) continue;
    await supabase.from('records').update({ record_type: 'challenge', challenged_record_id: record.id, updated_at: now }).eq('id', r.id);
    await notifyMember({
      userId: r.user_id, senderId: adminId,
      subject: `"${o.title}" now has its first official record holder`,
      body: `Another member's attempt at "${o.title}" was verified first, so they are the original AMPEX record holder.\n\nYour attempt is still being reviewed, now as a challenge to that record: if your result beats it, you take the record.`,
    });
  }
  return o;
};

// PUT /api/admin/open-records/:id/holder { recordId } — the admin chooses the verified first holder
const setHolder = async (req, res) => {
  if (!isUUID(req.params.id) || !isUUID(req.body?.recordId)) return res.status(400).json({ message: 'Choose a verified attempt' });
  try {
    const { data: rec } = await supabase.from('records').select('id, user_id, status, open_record_id').eq('id', req.body.recordId).maybeSingle();
    if (!rec || rec.open_record_id !== req.params.id) return res.status(400).json({ message: 'That attempt is not for this record' });
    if (rec.status !== 'verified') return res.status(400).json({ message: 'Only a verified attempt can be the record holder. Verify it first in Records.' });
    const o = await markSet(req.params.id, rec, { adminId: req.user.id });
    const [one] = await enrich([o]);
    res.json(one);
  } catch (e) {
    res.status(500).json({ message: 'Could not set the record holder', error: e.message });
  }
};

// Called whenever a record's verified status changes (utils/rankings.syncRecordAward). Never throws.
const onRecordVerified = async (recordId, verified) => {
  try {
    const { data: rec } = await supabase.from('records').select('id, user_id, status, open_record_id').eq('id', recordId).maybeSingle();
    if (!rec?.open_record_id) return;
    const { data: o } = await supabase.from('open_records').select('id, status, record_id').eq('id', rec.open_record_id).maybeSingle();
    if (!o) return;
    if (verified && o.status === 'open') await markSet(o.id, rec);
    // the record that set it is no longer verified: the open record is open again
    if (!verified && o.status === 'set' && o.record_id === rec.id) {
      await supabase.from('open_records').update({ status: 'open', record_id: null, set_at: null, updated_at: new Date().toISOString() }).eq('id', o.id);
    }
  } catch (e) {
    console.warn('[Open records] update failed:', e.message);
  }
};

// PUT /api/admin/open-records/order { ids } — the order challenges appear in on the page
const reorder = async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
  if (!ids.length || ids.length > 1000 || !ids.every(isUUID)) return res.status(400).json({ message: 'Send the challenges in the order you want them.' });
  try {
    const results = await Promise.all(ids.map((id, i) => supabase.from('open_records').update({ sort_order: (i + 1) * 10 }).eq('id', id)));
    const failed = results.find((r) => r.error);
    if (failed) throw failed.error;
    res.json({ message: 'Order saved.' });
  } catch (e) {
    res.status(500).json({ message: 'Could not save the order', error: e.message });
  }
};

// The general rules shown on Try These Records and every challenge page (admin-editable)
const readRules = async () => {
  const { data } = await supabase.from('system_settings').select('value').eq('key', RULES_KEY).maybeSingle();
  try { const v = JSON.parse(data?.value || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
};
const getRules = async (req, res) => {
  try { res.json(await readRules()); } catch (e) { res.status(500).json({ message: 'Could not load the rules' }); }
};
const saveRules = async (req, res) => {
  const rules = (Array.isArray(req.body?.rules) ? req.body.rules : [])
    .map((r) => ({ heading: text(r.heading, 120), text: text(r.text, 3000) })).filter((r) => r.heading || r.text).slice(0, 30);
  try {
    const { error } = await supabase.from('system_settings').upsert({ key: RULES_KEY, value: JSON.stringify(rules), updated_at: new Date() }, { onConflict: 'key' });
    if (error) throw error;
    res.json(rules);
  } catch (e) {
    res.status(500).json({ message: 'Could not save the rules', error: e.message });
  }
};

module.exports = { list, getOne, create, update, attempts, setHolder, onRecordVerified, codeOf, reorder, getRules, saveRules, RULES_KEY };
