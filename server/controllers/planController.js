const supabase = require('../config/supabase');

// Membership plans live in the membership_plans table (admin-editable).
// Built-in values are only a fallback for a database that hasn't run the 2026-11-09 migration.
const FALLBACK_PLANS = [
  { slug: 'free', name: 'Free', price: 0, billing_interval: 'month', submission_limit: 3, features: ['3 record submissions per month'], sort_order: 0 },
  { slug: 'bronze', name: 'Bronze', price: 10.99, billing_interval: 'month', submission_limit: 10, features: ['10 record submissions per month'], sort_order: 1 },
  { slug: 'silver', name: 'Silver', price: 20, billing_interval: 'month', submission_limit: 15, features: ['15 record submissions per month'], sort_order: 2 },
  { slug: 'gold', name: 'Gold', price: 50, billing_interval: 'month', submission_limit: null, features: ['Unlimited record submissions'], sort_order: 3 },
];

const formatPlan = (p) => ({
  id: p.id || p.slug,
  slug: p.slug,
  name: p.name,
  description: p.description || '',
  price: Number(p.price) || 0,
  billingInterval: p.billing_interval || 'month',
  submissionLimit: p.submission_limit === null || p.submission_limit === undefined ? null : Number(p.submission_limit),
  features: Array.isArray(p.features) ? p.features : [],
  priorityReview: !!p.priority_review,
  vipProfile: !!p.vip_profile,
  color: p.color || '#FF6A00',
  sortOrder: p.sort_order || 0,
  active: p.active !== false,
  stripePriceId: p.stripe_price_id || null,
});

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

// Used by the membership controller: plan by slug (active or not).
const getPlanBySlug = async (slug) => {
  const { data, error } = await supabase.from('membership_plans').select('*').eq('slug', slug).maybeSingle();
  if (error) {
    const fb = FALLBACK_PLANS.find((p) => p.slug === slug);
    return fb ? formatPlan(fb) : null;
  }
  return data ? formatPlan(data) : null;
};

// @route GET /api/membership-plans  (public: active plans)
const listPublicPlans = async (req, res) => {
  const { data, error } = await supabase.from('membership_plans').select('*').eq('active', true).order('sort_order');
  if (error) return res.json(FALLBACK_PLANS.map(formatPlan));
  res.json((data || []).map(formatPlan));
};

// @route GET /api/membership-plans/all  (admin)
const listAllPlans = async (req, res) => {
  const { data, error } = await supabase.from('membership_plans').select('*').order('sort_order');
  if (error) return res.status(500).json({ message: 'Could not load plans', error: error.message });
  // how many active members each plan has
  const { data: members } = await supabase.from('memberships').select('tier').eq('status', 'active');
  const counts = {};
  (members || []).forEach((m) => { counts[m.tier] = (counts[m.tier] || 0) + 1; });
  res.json((data || []).map((p) => ({ ...formatPlan(p), activeMembers: counts[p.slug] || 0 })));
};

const readBody = (b, partial = false) => {
  const out = {};
  const set = (k, v) => { if (!partial || v !== undefined) out[k] = v; };
  if (b.name !== undefined || !partial) set('name', String(b.name || '').trim());
  set('description', b.description !== undefined ? String(b.description) : undefined);
  if (b.price !== undefined || !partial) {
    const price = parseFloat(b.price);
    set('price', Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : 0);
  }
  if (b.billingInterval !== undefined || !partial) {
    set('billing_interval', ['month', 'year', 'one_time'].includes(b.billingInterval) ? b.billingInterval : 'month');
  }
  if (b.submissionLimit !== undefined || !partial) {
    const n = parseInt(b.submissionLimit, 10);
    set('submission_limit', b.submissionLimit === null || b.submissionLimit === '' || !Number.isFinite(n) || n < 0 ? null : n);
  }
  if (b.features !== undefined) {
    const list = Array.isArray(b.features) ? b.features : String(b.features).split('\n');
    out.features = list.map((f) => String(f).trim()).filter(Boolean);
  }
  if (b.priorityReview !== undefined) out.priority_review = !!b.priorityReview;
  if (b.vipProfile !== undefined) out.vip_profile = !!b.vipProfile;
  if (b.color !== undefined) out.color = b.color;
  if (b.sortOrder !== undefined) out.sort_order = parseInt(b.sortOrder, 10) || 0;
  if (b.active !== undefined) out.active = !!b.active;
  if (b.stripePriceId !== undefined) out.stripe_price_id = b.stripePriceId || null;
  return out;
};

// @route POST /api/membership-plans  (admin)
const createPlan = async (req, res) => {
  const row = readBody(req.body);
  if (!row.name) return res.status(400).json({ message: 'Plan name is required' });
  row.slug = slugify(req.body.slug || row.name);
  if (row.description == null) row.description = '';
  if (row.features == null) row.features = [];
  if (!row.slug) return res.status(400).json({ message: 'Plan needs a name with letters or numbers' });
  const { data, error } = await supabase.from('membership_plans').insert([row]).select().single();
  if (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'A plan with that name already exists' });
    return res.status(500).json({ message: 'Could not create plan', error: error.message });
  }
  res.status(201).json(formatPlan(data));
};

// @route PUT /api/membership-plans/:id  (admin) — the slug stays fixed so existing members keep their plan
const updatePlan = async (req, res) => {
  const row = readBody(req.body, true);
  if (row.name === '') return res.status(400).json({ message: 'Plan name is required' });
  row.updated_at = new Date();
  const { data, error } = await supabase.from('membership_plans').update(row).eq('id', req.params.id).select().maybeSingle();
  if (error) return res.status(500).json({ message: 'Could not update plan', error: error.message });
  if (!data) return res.status(404).json({ message: 'Plan not found' });
  res.json(formatPlan(data));
};

// @route DELETE /api/membership-plans/:id  (admin) — plans with members are hidden, not deleted
const deletePlan = async (req, res) => {
  const { data: plan } = await supabase.from('membership_plans').select('id, slug').eq('id', req.params.id).maybeSingle();
  if (!plan) return res.status(404).json({ message: 'Plan not found' });
  const { count } = await supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('tier', plan.slug);
  if (count > 0) {
    await supabase.from('membership_plans').update({ active: false, updated_at: new Date() }).eq('id', plan.id);
    return res.json({ message: 'Plan has members, so it was hidden instead of deleted', hidden: true });
  }
  const { error } = await supabase.from('membership_plans').delete().eq('id', plan.id);
  if (error) return res.status(500).json({ message: 'Could not delete plan', error: error.message });
  res.json({ message: 'Plan deleted' });
};

module.exports = { listPublicPlans, listAllPlans, createPlan, updatePlan, deletePlan, getPlanBySlug, formatPlan };
