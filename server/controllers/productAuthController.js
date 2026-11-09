const supabase = require('../config/supabase');

// Products flagged "requires_authorization" (e.g. championship belts) can only be bought by
// a competitor an administrator has approved for that specific product.

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));

const format = (a) => ({
  id: a.id,
  productId: a.product_id,
  userId: a.user_id,
  status: a.status,
  requestNote: a.request_note || '',
  adminNote: a.admin_note || '',
  decidedAt: a.decided_at,
  orderId: a.order_id,
  createdAt: a.created_at,
  product: a.product ? { id: a.product.id, name: a.product.name, imageUrl: a.product.image_url, price: Number(a.product.price) } : undefined,
  user: a.user ? { id: a.user.id, name: a.user.name, email: a.user.email, username: a.user.username } : undefined,
});

// @route GET /api/shop/:id/authorization  (logged-in user: my status for this product)
const getMyAuthorization = async (req, res) => {
  if (!isUUID(req.params.id)) return res.json({ status: 'none' });
  const { data } = await supabase
    .from('product_authorizations')
    .select('*')
    .eq('product_id', req.params.id)
    .eq('user_id', req.user.id)
    .maybeSingle();
  res.json(data ? format(data) : { status: 'none' });
};

// @route POST /api/shop/:id/authorization  (logged-in user: request approval)
const requestAuthorization = async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Product not found' });
  const { data: product } = await supabase.from('products').select('id, name, requires_authorization').eq('id', req.params.id).maybeSingle();
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (!product.requires_authorization) return res.status(400).json({ message: 'This product does not need approval' });

  const note = String(req.body.note || '').slice(0, 1000);
  const { data: existing } = await supabase
    .from('product_authorizations')
    .select('*')
    .eq('product_id', product.id)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (existing && ['pending', 'approved'].includes(existing.status)) {
    return res.json(format(existing));
  }
  const row = { product_id: product.id, user_id: req.user.id, status: 'pending', request_note: note, admin_note: null, decided_by: null, decided_at: null, updated_at: new Date() };
  const { data, error } = existing
    ? await supabase.from('product_authorizations').update(row).eq('id', existing.id).select().single()
    : await supabase.from('product_authorizations').insert([row]).select().single();
  if (error) return res.status(500).json({ message: 'Could not send the request', error: error.message });
  res.status(201).json(format(data));
};

// @route GET /api/admin/product-authorizations?status=pending  (admin)
const listAuthorizations = async (req, res) => {
  let q = supabase
    .from('product_authorizations')
    .select('*, product:products(id, name, image_url, price), user:users!product_authorizations_user_id_fkey(id, name, email, username)')
    .order('created_at', { ascending: false })
    .limit(500);
  if (req.query.status && req.query.status !== 'all') q = q.eq('status', req.query.status);
  const { data, error } = await q;
  if (error) return res.status(500).json({ message: 'Could not load authorizations', error: error.message });
  res.json((data || []).map(format));
};

// @route POST /api/admin/product-authorizations  (admin: grant directly, without a request)
const grantAuthorization = async (req, res) => {
  const { productId, userId, adminNote } = req.body;
  if (!isUUID(productId) || !isUUID(userId)) return res.status(400).json({ message: 'Choose a product and a competitor' });
  const row = { product_id: productId, user_id: userId, status: 'approved', admin_note: adminNote || null, decided_by: req.user.id, decided_at: new Date(), updated_at: new Date() };
  const { data, error } = await supabase.from('product_authorizations').upsert([row], { onConflict: 'product_id,user_id' }).select().single();
  if (error) return res.status(500).json({ message: 'Could not grant approval', error: error.message });
  res.status(201).json(format(data));
};

// @route PUT /api/admin/product-authorizations/:id  (admin: approve / deny / revoke)
const decideAuthorization = async (req, res) => {
  const { status, adminNote } = req.body;
  if (!['approved', 'denied', 'revoked', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved, denied, revoked or pending' });
  }
  const { data, error } = await supabase
    .from('product_authorizations')
    .update({ status, admin_note: adminNote ?? undefined, decided_by: req.user.id, decided_at: new Date(), updated_at: new Date() })
    .eq('id', req.params.id)
    .select()
    .maybeSingle();
  if (error) return res.status(500).json({ message: 'Could not update', error: error.message });
  if (!data) return res.status(404).json({ message: 'Authorization not found' });
  res.json(format(data));
};

module.exports = { getMyAuthorization, requestAuthorization, listAuthorizations, grantAuthorization, decideAuthorization };
