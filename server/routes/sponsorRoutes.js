const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

const isUUID = (v) => /^[0-9a-f-]{36}$/i.test(String(v || ''));
const PUBLIC_COLUMNS = 'id, company_name, logo_url, banner_url, link_url, placement, package_type, description, end_date, image_fit, image_position, video_url';

// @desc    Active sponsors for one or more placements (comma separated)
// @route   GET /api/sponsors?placement=homepage_top_banner,homepage
// @access  Public
router.get('/', async (req, res) => {
  try {
    const placements = String(req.query.placement || '').split(',').map((p) => p.trim()).filter(Boolean);
    const now = new Date().toISOString();
    let query = supabase
      .from('sponsors')
      .select(PUBLIC_COLUMNS)
      .eq('active_status', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .order('created_at', { ascending: false })
      .limit(20);
    if (placements.length) query = query.in('placement', placements);
    const { data, error } = await query;
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

// Public impression / click tracking (shown in the admin Sponsorships tab)
router.post('/:id/view', bump('views_count'));
router.post('/:id/click', bump('clicks_count'));

module.exports = router;
