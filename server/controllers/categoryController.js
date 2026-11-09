const supabase = require('../config/supabase');

// Helper to slugify
const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const getFormattedCategory = (c) => ({
  _id: c.id,
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description || '',
  parent: c.parent,
  order: c.order_num || 0,
  active: c.active,
  isDefault: c.is_default,
  rules: c.rules || '',
  submissionRequirements: c.submission_requirements || '',
  createdAt: c.created_at,
  updatedAt: c.updated_at
});

// GET /api/categories - list tree
const getAllCategories = async (req, res) => {
  try {
    const { data: dbCategories, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_num', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    const categories = dbCategories.map(getFormattedCategory);

    // Verified/total record counts per category (records store the category name; newer ones also the id)
    const { data: recs } = await supabase.from('records').select('category, category_id, status');
    const byName = {};
    (recs || []).forEach((r) => {
      const key = (r.category || '').trim().toLowerCase();
      byName[key] = byName[key] || { total: 0, verified: 0 };
      byName[key].total++;
      if (r.status === 'verified') byName[key].verified++;
    });
    categories.forEach((c) => {
      const s = byName[c.name.trim().toLowerCase()] || { total: 0, verified: 0 };
      c.recordCount = s.total;
      c.verifiedCount = s.verified;
    });

    // Build tree
    const map = {};
    categories.forEach(c => map[c.id] = { ...c, children: [] });
    const roots = [];
    categories.forEach(c => {
      if (c.parent) {
        if (map[c.parent]) map[c.parent].children.push(map[c.id]);
      } else roots.push(map[c.id]);
    });

    res.json({ categories: roots, flat: categories });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const { data: cat, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !cat) return res.status(404).json({ message: 'Category not found' });
    res.json(getFormattedCategory(cat));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
};

// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, description, parent, order = 0, active = true, rules = '', submissionRequirements = '' } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const slug = slugify(name);

    // Check duplicate
    const { data: exists } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (exists) return res.status(400).json({ message: 'Category with that name or slug already exists' });

    const { data: cat, error } = await supabase
      .from('categories')
      .insert([{
        name,
        slug,
        description: description || '',
        parent: parent || null,
        order_num: parseInt(order) || 0,
        active: active !== undefined ? active : true,
        is_default: false,
        rules,
        submission_requirements: submissionRequirements
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Category created', category: getFormattedCategory(cat) });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { name, description, parent, order, active, rules, submissionRequirements } = req.body;

    const { data: existingCat, error: findError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !existingCat) return res.status(404).json({ message: 'Category not found' });

    const updates = {
      updated_at: new Date()
    };
    if (name && name !== existingCat.name) {
      updates.name = name;
      updates.slug = slugify(name);
    }
    if (typeof description !== 'undefined') updates.description = description;
    if (typeof parent !== 'undefined') {
      if (parent && parent === req.params.id) return res.status(400).json({ message: 'A category cannot be its own parent' });
      updates.parent = parent || null;
    }
    if (typeof order !== 'undefined') updates.order_num = parseInt(order);
    if (typeof active !== 'undefined') updates.active = active;
    if (typeof rules !== 'undefined') updates.rules = rules;
    if (typeof submissionRequirements !== 'undefined') updates.submission_requirements = submissionRequirements;

    const { data: cat, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Category updated', category: getFormattedCategory(cat) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { data: cat, error: findError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !cat) return res.status(404).json({ message: 'Category not found' });

    // Check subcategories
    const { data: children, error: childrenError } = await supabase
      .from('categories')
      .select('id')
      .eq('parent', cat.id);

    if (childrenError) throw childrenError;
    if (children && children.length > 0) {
      // Keep the subcategories: they move up to the top level (the admin can re-parent them later)
      const { error: moveError } = await supabase.from('categories').update({ parent: cat.parent || null, updated_at: new Date() }).eq('parent', cat.id);
      if (moveError) throw moveError;
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', cat.id);

    if (error) throw error;
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

// POST /api/categories/seed - create default categories
const seedDefaultCategories = async (req, res) => {
  try {
    const defaultList = [
      { name: 'Strength', order: 1 },
      { name: 'Speed', order: 2 },
      { name: 'Endurance', order: 3 },
      { name: 'Balance', order: 4 },
      { name: 'Flexibility', order: 5 },
      { name: 'Fitness', order: 6 },
      { name: 'Sports', order: 7 },
      { name: 'Gaming', order: 8 },
      { name: 'Entertainment', order: 9 },
      { name: 'Creative Skills', order: 10 },
      { name: 'Stunts', order: 11 },
      { name: 'Food Challenges', order: 12 },
      { name: 'Animal Records', order: 13 },
      { name: 'Team Records', order: 14 },
      { name: 'Kids / Youth Records', order: 15 },
      { name: 'Senior Records', order: 16 },
      { name: 'Extreme Challenges', order: 17 },
      { name: 'Precision Skills', order: 18 },
      { name: 'Technology / Innovation', order: 19 },
      { name: 'Miscellaneous', order: 20 },
    ];
    const created = [];
    for (let cat of defaultList) {
      const slug = slugify(cat.name);
      const { data: existing } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!existing) {
        const { data: c, error } = await supabase
          .from('categories')
          .insert([{
            name: cat.name,
            slug,
            is_default: true,
            active: true,
            order_num: cat.order
          }])
          .select()
          .single();

        if (error) throw error;
        created.push(getFormattedCategory(c));
      }
    }
    res.json({ message: 'Default categories seeded', createdCount: created.length });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding categories', error: error.message });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories
};
