const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect, admin } = require('../middleware/authMiddleware');

const isUUID = (v) => /^[0-9a-f-]{36}$/i.test(String(v || ''));
const BASE_COLUMNS = 'id, company_name, logo_url, banner_url, link_url, placement, package_type, description, end_date, image_fit, image_position, video_url, content_type';
const PUBLIC_COLUMNS = `${BASE_COLUMNS}, ad_seconds`;
// Until the Nov 25 database update adds sponsors.ad_seconds, read without it instead of failing
const missingColumn = (error) => error && (error.code === '42703' || /ad_seconds|price_period|column .* does not exist/i.test(error.message || ''));

// @desc    Active sponsors for one or more placements (comma separated)
// @route   GET /api/sponsors?placement=homepage_top_banner,homepage
// @access  Public
router.get('/', async (req, res) => {
  try {
    const placements = String(req.query.placement || '').split(',').map((p) => p.trim()).filter(Boolean);
    const now = new Date().toISOString();
    const build = (columns) => {
      let query = supabase
        .from('sponsors')
        .select(columns)
        .eq('active_status', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (placements.length) query = query.in('placement', placements);
      return query;
    };
    let { data, error } = await build(PUBLIC_COLUMNS);
    if (missingColumn(error)) ({ data, error } = await build(BASE_COLUMNS));
    if (error) throw error;
    // end_date counts through the whole of its day
    const now2 = new Date();
    res.json((data || []).filter((sp) => {
      if (!sp.end_date) return true;
      const endOfDay = new Date(sp.end_date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      return endOfDay >= now2;
    }).map(({ end_date, ...pub }) => pub));
  } catch (error) {
    console.error('Public sponsors error:', error.message);
    res.status(500).json({ message: 'Could not load sponsors' });
  }
});

const bump = (column) => async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Sponsor not found' });
  try {
    const { data: sponsor } = await supabase.from('sponsors').select(column).eq('id', req.params.id).maybeSingle();
    if (!sponsor) return res.status(404).json({ message: 'Sponsor not found' });
    await supabase.from('sponsors').update({ [column]: (sponsor[column] || 0) + 1 }).eq('id', req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Could not track' });
  }
};

// Admin preview: a sponsor exactly as it will look, even before its start date or while switched off
router.get('/preview/:id', protect, admin, async (req, res) => {
  if (!isUUID(req.params.id)) return res.status(404).json({ message: 'Sponsor not found' });
  let { data, error } = await supabase.from('sponsors').select(PUBLIC_COLUMNS).eq('id', req.params.id).maybeSingle();
  if (missingColumn(error)) ({ data, error } = await supabase.from('sponsors').select(BASE_COLUMNS).eq('id', req.params.id).maybeSingle());
  if (error || !data) return res.status(404).json({ message: 'Sponsor not found' });
  const { end_date, ...pub } = data;
  res.json(pub);
});

// Public impression / click tracking (shown in the admin Sponsorships tab)
router.post('/:id/view', bump('views_count'));
router.post('/:id/click', bump('clicks_count'));

module.exports = router;
