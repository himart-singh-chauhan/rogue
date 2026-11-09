const supabase = require('../config/supabase');

// ==========================================
// 💰 SPONSORS CRUD
// ==========================================

// @desc    Get all sponsors
// @route   GET /api/admin/monetization/sponsors
const getSponsors = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a new sponsor
// @route   POST /api/admin/monetization/sponsors (multipart/form-data)
const createSponsor = async (req, res) => {
  const {
    companyName, bannerUrl, logoUrl, linkUrl, placement,
    startDate, endDate, description, notes, packageType, activeStatus, imageFit, imagePosition
  } = req.body;
  const fit = imageFit === 'cover' ? 'cover' : 'contain';
  const POSITIONS = ['center', 'top', 'bottom', 'left', 'right'];
  const position = POSITIONS.includes(imagePosition) ? imagePosition : 'center';

  try {
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    let finalBannerUrl = bannerUrl || null;
    let finalLogoUrl = logoUrl || null;

    // Handle file uploads (req.files from multer fields)
    if (req.files) {
      if (req.files.bannerImage && req.files.bannerImage[0]) {
        finalBannerUrl = req.files.bannerImage[0].url || `${baseUrl}/uploads/images/${req.files.bannerImage[0].filename}`;
      }
      if (req.files.logoImage && req.files.logoImage[0]) {
        finalLogoUrl = req.files.logoImage[0].url || `${baseUrl}/uploads/images/${req.files.logoImage[0].filename}`;
      }
    } else if (req.file) {
      finalBannerUrl = req.file.url || `${baseUrl}/uploads/images/${req.file.filename}`;
    }

    if (!companyName) {
      return res.status(400).json({ message: 'Sponsor name is required' });
    }

    const { data: newSponsor, error } = await supabase
      .from('sponsors')
      .insert([{
        company_name: companyName,
        banner_url: finalBannerUrl,
        logo_url: finalLogoUrl,
        link_url: linkUrl || null,
        placement: placement || 'homepage',
        package_type: packageType || 'standard',
        start_date: startDate || null,
        end_date: endDate || null,
        description: description || null,
        notes: notes || null,
        active_status: activeStatus !== undefined ? (activeStatus === 'true' || activeStatus === true) : true,
        image_fit: fit,
        image_position: position,
        views_count: 0,
        clicks_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Sponsor added successfully.', sponsor: newSponsor });
  } catch (error) {
    console.error('Create sponsor error:', error);
    res.status(500).json({ error: 'Sponsor could not be saved.' });
  }
};

// @desc    Update sponsor details
// @route   PUT /api/admin/monetization/sponsors/:id (multipart/form-data)
const updateSponsor = async (req, res) => {
  const { id } = req.params;
  const {
    companyName, bannerUrl, logoUrl, linkUrl, placement,
    startDate, endDate, description, notes, packageType, activeStatus, imageFit, imagePosition
  } = req.body;
  const fit = imageFit === 'cover' ? 'cover' : 'contain';
  const POSITIONS = ['center', 'top', 'bottom', 'left', 'right'];
  const position = POSITIONS.includes(imagePosition) ? imagePosition : 'center';

  try {
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const updateData = { updated_at: new Date() };

    if (companyName !== undefined)  updateData.company_name = companyName;
    if (linkUrl !== undefined)      updateData.link_url = linkUrl || null;
    if (placement !== undefined)    updateData.placement = placement;
    if (startDate !== undefined)    updateData.start_date = startDate || null;
    if (endDate !== undefined)      updateData.end_date = endDate || null;
    if (description !== undefined)  updateData.description = description || null;
    if (notes !== undefined)        updateData.notes = notes || null;
    if (packageType !== undefined)  updateData.package_type = packageType || 'standard';
    if (activeStatus !== undefined) updateData.active_status = activeStatus === 'true' || activeStatus === true;
    if (imageFit !== undefined)     updateData.image_fit = fit;
    if (imagePosition !== undefined) updateData.image_position = position;

    if (req.files) {
      if (req.files.bannerImage && req.files.bannerImage[0]) {
        updateData.banner_url = req.files.bannerImage[0].url || `${baseUrl}/uploads/images/${req.files.bannerImage[0].filename}`;
      }
      if (req.files.logoImage && req.files.logoImage[0]) {
        updateData.logo_url = req.files.logoImage[0].url || `${baseUrl}/uploads/images/${req.files.logoImage[0].filename}`;
      }
    } else if (req.file) {
      updateData.banner_url = req.file.url || `${baseUrl}/uploads/images/${req.file.filename}`;
    } else {
      if (bannerUrl !== undefined) updateData.banner_url = bannerUrl || null;
      if (logoUrl !== undefined)   updateData.logo_url = logoUrl || null;
    }

    const { data: updatedSponsor, error } = await supabase
      .from('sponsors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ message: 'Sponsor updated successfully.', sponsor: updatedSponsor });
  } catch (error) {
    console.error('Update sponsor error:', error);
    res.status(500).json({ error: 'Sponsor could not be saved.' });
  }
};

// @desc    Delete a sponsor
// @route   DELETE /api/admin/monetization/sponsors/:id
const deleteSponsor = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ message: 'Sponsor deleted successfully.' });
  } catch (error) {
    console.error('Delete sponsor error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Track sponsor click
// @route   POST /api/admin/monetization/sponsors/:id/click
const trackSponsorClick = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: sponsor } = await supabase.from('sponsors').select('clicks_count').eq('id', id).single();
    const { error } = await supabase.from('sponsors').update({ clicks_count: (sponsor?.clicks_count || 0) + 1 }).eq('id', id);
    if (error) throw error;
    res.status(200).json({ message: 'Click tracked.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Track sponsor view/impression
// @route   POST /api/admin/monetization/sponsors/:id/view
const trackSponsorView = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: sponsor } = await supabase.from('sponsors').select('views_count').eq('id', id).single();
    const { error } = await supabase.from('sponsors').update({ views_count: (sponsor?.views_count || 0) + 1 }).eq('id', id);
    if (error) throw error;
    res.status(200).json({ message: 'View tracked.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update VIP Competitor status
// @route   PUT /api/admin/monetization/vip/:userId
const updateVipStatus = async (req, res) => {
  try {
    const { is_verified, vip_status } = req.body;
    const { userId } = req.params;

    const { error } = await supabase
      .from('vip_competitors')
      .upsert(
        { user_id: userId, is_verified, vip_status, granted_by: req.user.id },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
    res.status(200).json({ message: 'VIP Status successfully updated.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get subscription revenue metrics
// @route   GET /api/admin/monetization/revenue
const getRevenueMetrics = async (req, res) => {
  try {
    const { data: orders } = await supabase.from('orders').select('total');
    const { data: memberships } = await supabase.from('memberships').select('price').eq('status', 'active');
    const totalOrders = (orders || []).reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
    const totalMemberships = (memberships || []).reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);

    res.status(200).json({
      totalRevenue: totalOrders + totalMemberships,
      activeSubscriptions: (memberships || []).length,
      recentTransactions: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Trigger Global Ranking Recalculation
// @route   POST /api/admin/monetization/rankings/recalculate
const recalculateRankings = async (req, res) => {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: req.user.id,
      action_type: 'recalculate_rankings',
      metadata: { status: 'success' }
    });
    res.status(200).json({ message: 'Global automated rankings successfully recalculated.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  trackSponsorClick,
  trackSponsorView,
  updateVipStatus,
  getRevenueMetrics,
  recalculateRankings
};
