const supabase = require('../config/supabase');

// ===================================================================================
// MEDIA LIBRARY — files are uploaded straight to storage (signed URL), then saved here
// ===================================================================================
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
const ASSET_TYPES = ['photo', 'video', 'graphic', 'banner', 'social', 'certificate', 'document', 'other'];

const guessType = (mime = '') => {
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'photo';
  if (mime === 'application/pdf') return 'document';
  return 'other';
};

// POST /api/admin/media  { fileUrl, title, assetType, fileName, mimeType, fileSize }
const createMediaAsset = async (req, res) => {
  const { fileUrl, title, assetType, fileName, mimeType, fileSize } = req.body;
  if (!fileUrl) return res.status(400).json({ message: 'Upload a file first' });
  const row = {
    uploader_id: req.user.id,
    file_url: fileUrl,
    title: String(title || fileName || 'Untitled asset').slice(0, 200),
    asset_type: ASSET_TYPES.includes(assetType) ? assetType : guessType(mimeType),
    file_name: fileName || null,
    mime_type: mimeType || null,
    file_size: Number(fileSize) || null,
  };
  const { data, error } = await supabase.from('media_assets').insert([row]).select('*, uploader_id(username)').single();
  if (error) return res.status(500).json({ message: 'Could not save the asset', error: error.message });
  res.status(201).json(data);
};

// PUT /api/admin/media/:id  { title, assetType }
const updateMediaAsset = async (req, res) => {
  const updates = {};
  if (req.body.title !== undefined) updates.title = String(req.body.title).slice(0, 200);
  if (req.body.assetType !== undefined && ASSET_TYPES.includes(req.body.assetType)) updates.asset_type = req.body.assetType;
  const { data, error } = await supabase.from('media_assets').update(updates).eq('id', req.params.id).select().maybeSingle();
  if (error) return res.status(500).json({ message: 'Could not update the asset', error: error.message });
  if (!data) return res.status(404).json({ message: 'Asset not found' });
  res.json(data);
};

// DELETE /api/admin/media/:id  (also removes the file from storage when it lives in our bucket)
const deleteMediaAsset = async (req, res) => {
  const { data: asset } = await supabase.from('media_assets').select('id, file_url').eq('id', req.params.id).maybeSingle();
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = (asset.file_url || '').indexOf(marker);
  if (i >= 0) {
    const objectPath = decodeURIComponent(asset.file_url.slice(i + marker.length));
    const { error: rmError } = await supabase.storage.from(BUCKET).remove([objectPath]);
    if (rmError) console.warn('Media file removal failed (row still deleted):', rmError.message);
  }
  const { error } = await supabase.from('media_assets').delete().eq('id', asset.id);
  if (error) return res.status(500).json({ message: 'Could not delete the asset', error: error.message });
  res.json({ message: 'Asset deleted' });
};

// ===================================================================================
// MESSAGES — admin composer + user inbox
// ===================================================================================

// POST /api/admin/messages  { to: 'user' | 'all', receiverId, subject, body }
const sendAdminMessage = async (req, res) => {
  const subject = String(req.body.subject || '').trim();
  const body = String(req.body.body || '').trim();
  const to = req.body.to === 'all' ? 'all' : 'user';
  const receiverId = req.body.receiverId || req.body.receiver_id;
  if (!subject || !body) return res.status(400).json({ message: 'Subject and message are required' });

  let receivers = [];
  if (to === 'all') {
    const { data: users, error } = await supabase.from('users').select('id').neq('id', req.user.id);
    if (error) return res.status(500).json({ message: 'Could not load recipients', error: error.message });
    receivers = (users || []).map((u) => u.id);
  } else {
    if (!receiverId) return res.status(400).json({ message: 'Choose a recipient' });
    receivers = [receiverId];
  }
  if (!receivers.length) return res.status(400).json({ message: 'There are no recipients' });

  const rows = receivers.map((id) => ({ sender_id: req.user.id, receiver_id: id, subject, body }));
  const { error } = await supabase.from('messages').insert(rows);
  if (error) return res.status(500).json({ message: 'Message could not be sent', error: error.message });
  res.status(201).json({ message: `Message sent to ${rows.length} ${rows.length === 1 ? 'member' : 'members'}`, count: rows.length });
};

// GET /api/messages  (logged-in user inbox)
const getMyMessages = async (req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('id, subject, body, is_read, created_at, sender:sender_id(name)')
    .eq('receiver_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ message: 'Could not load messages', error: error.message });
  res.json(data || []);
};

// PUT /api/messages/:id/read
const markMessageRead = async (req, res) => {
  const { error } = await supabase.from('messages').update({ is_read: true }).eq('id', req.params.id).eq('receiver_id', req.user.id);
  if (error) return res.status(500).json({ message: 'Could not update message' });
  res.json({ ok: true });
};

// ===================================================================================
// GLOBAL SEO — stored in system_settings, read by the website
// ===================================================================================
const SEO_KEYS = { title: 'seo_title', meta_description: 'seo_description', keywords: 'seo_keywords' };

// GET /api/settings/public
const getPublicSettings = async (req, res) => {
  const { data } = await supabase.from('system_settings').select('key, value').in('key', Object.values(SEO_KEYS));
  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  res.json({
    seoTitle: map.seo_title || 'AMPEX World Records Elite Athlete Database',
    seoDescription: map.seo_description || '',
    seoKeywords: map.seo_keywords || '',
  });
};

// PUT /api/admin/security/seo  { title, meta_description, keywords }
const updateSeoSettings = async (req, res) => {
  const rows = Object.entries(SEO_KEYS)
    .filter(([field]) => req.body[field] !== undefined)
    .map(([field, key]) => ({ key, value: String(req.body[field]).slice(0, 500), updated_at: new Date() }));
  if (!rows.length) return res.status(400).json({ message: 'Nothing to save' });
  if (rows.some((r) => r.key === 'seo_title' && !r.value.trim())) return res.status(400).json({ message: 'The SEO title cannot be empty' });
  const { error } = await supabase.from('system_settings').upsert(rows, { onConflict: 'key' });
  if (error) return res.status(500).json({ message: 'Could not save SEO settings', error: error.message });
  await supabase.from('audit_logs').insert({ actor_id: req.user.id, action_type: 'update_seo', metadata: req.body });
  res.json({ message: 'Global SEO settings saved.' });
};

// ===================================================================================
// MONETIZATION — breakdowns built only from real data
// ===================================================================================
const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
};

// GET /api/admin/monetization/breakdown
const getMonetizationBreakdown = async (req, res) => {
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 11, 1);
  since.setUTCHours(0, 0, 0, 0);

  const [mem, ord, items, tix, meta, manual, reds, plans] = await Promise.all([
    supabase.from('memberships').select('tier, status, price, payment_history, created_at, cancellation_date'),
    supabase.from('orders').select('id, total, subtotal, discount_amount, payment_status, created_at'),
    supabase.from('order_items').select('order_id, product_name, price, quantity'),
    supabase.from('tickets').select('status, created_at, event:events(ticket_price, is_paid)'),
    supabase.from('record_meta').select('payment_status, submission_fee, created_at'),
    supabase.from('manual_revenues').select('amount, status, category, date_received, created_at'),
    supabase.from('coupon_redemptions').select('discount_amount, context, created_at, coupon:coupons(code)'),
    supabase.from('membership_plans').select('slug, name, sort_order'),
  ]);

  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(since);
    d.setUTCMonth(since.getUTCMonth() + i);
    months.push(monthKey(d));
  }
  const trend = Object.fromEntries(months.map((m) => [m, { month: m, membership: 0, shop: 0, tickets: 0, submissions: 0, manual: 0, total: 0 }]));
  const addTrend = (date, kind, amount) => {
    const k = monthKey(date);
    if (trend[k]) { trend[k][kind] += amount; trend[k].total += amount; }
  };

  // Memberships: revenue by plan from completed payments; new / cancelled members per month
  const planName = Object.fromEntries((plans.data || []).map((p) => [p.slug, p.name]));
  const byTier = {};
  const newMembers = Object.fromEntries(months.map((m) => [m, 0]));
  const cancelled = Object.fromEntries(months.map((m) => [m, 0]));
  let activeMembers = 0;
  let failedPayments = 0;
  (mem.data || []).forEach((m) => {
    const t = byTier[m.tier] || (byTier[m.tier] = { tier: m.tier, name: planName[m.tier] || m.tier, revenue: 0, active: 0, total: 0 });
    t.total++;
    if (m.status === 'active') { t.active++; activeMembers++; }
    if (m.created_at && newMembers[monthKey(m.created_at)] !== undefined) newMembers[monthKey(m.created_at)]++;
    if (m.cancellation_date && cancelled[monthKey(m.cancellation_date)] !== undefined) cancelled[monthKey(m.cancellation_date)]++;
    (m.payment_history || []).forEach((p) => {
      const amount = Number(p.amount) || 0;
      if (p.status === 'completed' && amount > 0) {
        t.revenue += amount;
        addTrend(p.date || m.created_at, 'membership', amount);
      }
      if (p.status === 'failed') failedPayments++;
    });
  });

  // Shop
  const paidOrders = (ord.data || []).filter((o) => o.payment_status === 'paid');
  const shopRevenue = paidOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  paidOrders.forEach((o) => addTrend(o.created_at, 'shop', Number(o.total) || 0));
  const orderDiscounts = (ord.data || []).reduce((s, o) => s + (Number(o.discount_amount) || 0), 0);
  const paidIds = new Set(paidOrders.map((o) => o.id));
  const productSales = {};
  (items.data || []).filter((i) => paidIds.has(i.order_id)).forEach((i) => {
    const p = productSales[i.product_name] || (productSales[i.product_name] = { product: i.product_name, units: 0, revenue: 0 });
    p.units += Number(i.quantity) || 0;
    p.revenue += (Number(i.price) || 0) * (Number(i.quantity) || 0);
  });

  // Tickets, submission fees, manual revenue
  let ticketRevenue = 0;
  (tix.data || []).filter((t) => ['active', 'used'].includes(t.status) && t.event?.is_paid).forEach((t) => {
    const amount = Number(t.event.ticket_price) || 0;
    ticketRevenue += amount;
    addTrend(t.created_at, 'tickets', amount);
  });
  let submissionRevenue = 0;
  (meta.data || []).filter((m) => m.payment_status === 'paid').forEach((m) => {
    const amount = Number(m.submission_fee) || 0;
    submissionRevenue += amount;
    addTrend(m.created_at, 'submissions', amount);
  });
  let manualRevenue = 0;
  (manual.data || []).filter((m) => (m.status || 'paid') === 'paid').forEach((m) => {
    const amount = Number(m.amount) || 0;
    manualRevenue += amount;
    addTrend(m.date_received || m.created_at, 'manual', amount);
  });

  // Coupons
  const couponTotals = {};
  (reds.data || []).forEach((r) => {
    const code = r.coupon?.code || 'unknown';
    const c = couponTotals[code] || (couponTotals[code] = { code, uses: 0, discount: 0 });
    c.uses++;
    c.discount += Number(r.discount_amount) || 0;
  });

  const round = (n) => Math.round(n * 100) / 100;
  const membershipRevenue = Object.values(byTier).reduce((s, t) => s + t.revenue, 0);
  res.json({
    totals: {
      allTime: round(membershipRevenue + shopRevenue + ticketRevenue + submissionRevenue + manualRevenue),
      membership: round(membershipRevenue),
      shop: round(shopRevenue),
      tickets: round(ticketRevenue),
      submissions: round(submissionRevenue),
      manual: round(manualRevenue),
      couponDiscounts: round(Math.max(orderDiscounts, Object.values(couponTotals).reduce((s, c) => s + c.discount, 0))),
      activeMembers,
      failedPayments,
      orders: paidOrders.length,
    },
    membershipByTier: Object.values(byTier).map((t) => ({ ...t, revenue: round(t.revenue) })).sort((a, b) => b.revenue - a.revenue),
    memberMovement: months.map((m) => ({ month: m, newMembers: newMembers[m], cancelled: cancelled[m] })),
    topProducts: Object.values(productSales).map((p) => ({ ...p, revenue: round(p.revenue) })).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    coupons: Object.values(couponTotals).map((c) => ({ ...c, discount: round(c.discount) })).sort((a, b) => b.uses - a.uses),
    trend: months.map((m) => {
      const t = trend[m];
      return { ...t, membership: round(t.membership), shop: round(t.shop), tickets: round(t.tickets), submissions: round(t.submissions), manual: round(t.manual), total: round(t.total) };
    }),
  });
};

module.exports = {
  createMediaAsset, updateMediaAsset, deleteMediaAsset,
  sendAdminMessage, getMyMessages, markMessageRead,
  getPublicSettings, updateSeoSettings,
  getMonetizationBreakdown,
};
