const supabase = require('../config/supabase');

// Weight classes (Admin → Divisions). Ranges are fully custom: either limit may be empty.
const format = (w) => ({
  id: w.id,
  name: w.name,
  code: w.code || '',
  minWeight: w.min_weight === null ? null : Number(w.min_weight),
  maxWeight: w.max_weight === null ? null : Number(w.max_weight),
  unit: w.unit,
  categoryId: w.category_id,
  description: w.description || '',
  sortOrder: w.sort_order || 0,
  active: w.active !== false,
  label: rangeLabel(w),
});

function rangeLabel(w) {
  const u = w.unit || 'lbs';
  const min = w.min_weight === null ? null : Number(w.min_weight);
  const max = w.max_weight === null ? null : Number(w.max_weight);
  if (min === null && max === null) return 'Open weight';
  if (min === null) return `Up to ${max} ${u}`;
  if (max === null) return `${min} ${u} and over`;
  return `${min} – ${max} ${u}`;
}

const num = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

const readBody = (b) => {
  const row = {
    name: String(b.name || '').trim(),
    code: b.code ? String(b.code).trim().toUpperCase().slice(0, 10) : null,
    min_weight: num(b.minWeight),
    max_weight: num(b.maxWeight),
    unit: b.unit === 'kg' ? 'kg' : 'lbs',
    category_id: b.categoryId || null,
    description: String(b.description || ''),
    sort_order: parseInt(b.sortOrder, 10) || 0,
    active: b.active !== false,
  };
  return row;
};

const validate = (row) => {
  if (!row.name) return 'Weight class name is required';
  if (row.min_weight !== null && row.max_weight !== null && row.min_weight > row.max_weight) {
    return 'The minimum weight cannot be above the maximum weight';
  }
  return null;
};

// GET /api/weight-classes  (public; ?all=1 for admins includes inactive)
const listWeightClasses = async (req, res) => {
  let q = supabase.from('weight_classes').select('*').order('sort_order').order('min_weight', { nullsFirst: true });
  if (!(req.query.all && req.user?.is_admin)) q = q.eq('active', true);
  const { data, error } = await q;
  if (error) return res.status(500).json({ message: 'Could not load weight classes', error: error.message });
  res.json((data || []).map(format));
};

const createWeightClass = async (req, res) => {
  const row = readBody(req.body);
  const problem = validate(row);
  if (problem) return res.status(400).json({ message: problem });
  const { data, error } = await supabase.from('weight_classes').insert([row]).select().single();
  if (error) return res.status(500).json({ message: 'Could not create weight class', error: error.message });
  res.status(201).json(format(data));
};

const updateWeightClass = async (req, res) => {
  const row = readBody(req.body);
  const problem = validate(row);
  if (problem) return res.status(400).json({ message: problem });
  row.updated_at = new Date();
  const { data, error } = await supabase.from('weight_classes').update(row).eq('id', req.params.id).select().maybeSingle();
  if (error) return res.status(500).json({ message: 'Could not update weight class', error: error.message });
  if (!data) return res.status(404).json({ message: 'Weight class not found' });
  res.json(format(data));
};

const deleteWeightClass = async (req, res) => {
  const { error } = await supabase.from('weight_classes').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ message: 'Could not delete weight class', error: error.message });
  res.json({ message: 'Weight class deleted' });
};

module.exports = { listWeightClasses, createWeightClass, updateWeightClass, deleteWeightClass };
