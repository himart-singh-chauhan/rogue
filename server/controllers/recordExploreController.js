const supabase = require('../config/supabase');
const socialController = require('./socialController');
const { PUBLIC_RECORD_COLUMNS } = require('./recordController');

const USER_EMBED = 'user:users!records_user_id_fkey(username, name, display_name:name, profile_image, country)';
const SELECT = `${PUBLIC_RECORD_COLUMNS}, homepage_section, homepage_order, ${USER_EMBED}`;
const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));

const pageParams = (q, defLimit = 20) => {
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || defLimit, 1), 200);
  const offset = Math.max(parseInt(q.offset, 10) || 0, 0);
  return { limit, offset };
};

const cleanSearch = (s) => String(s || '').replace(/[,()*%\\]/g, ' ').trim();

// Public queries always start from verified records.
const verifiedQuery = () => supabase.from('records').select(SELECT, { count: 'exact' }).eq('status', 'verified');

const withSearch = (query, search) => {
  const term = cleanSearch(search);
  return term ? query.or(`title.ilike.%${term}%,category.ilike.%${term}%,athlete_id.ilike.%${term}%`) : query;
};

// Category may arrive as a uuid, a slug ("strength-training") or a display name ("Strength").
const withCategory = (query, category) => {
  if (!category || category === 'all' || category === 'All') return query;
  if (isUUID(category)) return query.eq('category_id', category);
  return query.ilike('category', String(category).replace(/-/g, ' ').trim());
};

const send = (res, { data, count, error }, limit, extra = {}) => {
  if (error && error.code !== 'PGRST103') throw error; // PGRST103 = page past the end → empty page
  res.json({ records: socialController.mergeSocialStats(data || []), total: count || 0, limit, ...extra });
};

const fail = (res, label, error) => {
  console.error(`${label} error:`, error);
  res.status(500).json({ message: `Could not load records`, error: error.message });
};

// Get homepage records organized by sections (public endpoint).
// Admin-assigned homepage_section / is_featured win; otherwise the newest verified records fill in.
exports.getHomepageSections = async (req, res) => {
  try {
    const { data: allVerified, error } = await supabase
      .from('records')
      .select(SELECT)
      .eq('status', 'verified')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    const records = allVerified || [];

    const bySection = (name) =>
      records
        .filter((r) => r.homepage_section === name)
        .sort((a, b) => (a.homepage_order || 0) - (b.homepage_order || 0));

    let featured = bySection('featured');
    if (!featured.length) featured = records.filter((r) => r.is_featured);
    if (!featured.length) featured = records.slice(0, 5);

    // Newest = the most recent verified records (they may also appear in Featured).
    let newlyVerified = bySection('newly_verified');
    if (!newlyVerified.length) newlyVerified = records.slice(0, 10);

    let topRanked = bySection('top_ranked');
    if (!topRanked.length) {
      topRanked = [...records].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0) || (b.views || 0) - (a.views || 0)).slice(0, 5);
    }

    const recentUploads = bySection('recent_uploads');

    res.json({
      featured: socialController.mergeSocialStats(featured.slice(0, 10)),
      newly_verified: socialController.mergeSocialStats(newlyVerified.slice(0, 10)),
      recent_uploads: socialController.mergeSocialStats(recentUploads.slice(0, 10)),
      top_ranked: socialController.mergeSocialStats(topRanked.slice(0, 10)),
    });
  } catch (error) {
    fail(res, 'Get homepage sections', error);
  }
};

// Get new records (most recently verified)
exports.getNewRecords = async (req, res) => {
  try {
    const { limit, offset } = pageParams(req.query);
    const result = await withSearch(verifiedQuery(), req.query.search)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    send(res, result, limit);
  } catch (error) {
    fail(res, 'Get new records', error);
  }
};

// Get featured records
exports.getFeaturedRecords = async (req, res) => {
  try {
    const { limit, offset } = pageParams(req.query);
    const result = await verifiedQuery()
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    send(res, result, limit);
  } catch (error) {
    fail(res, 'Get featured records', error);
  }
};

// Get most viewed records
exports.getMostViewedRecords = async (req, res) => {
  try {
    const { limit, offset } = pageParams(req.query);
    const result = await verifiedQuery()
      .order('views', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    send(res, result, limit);
  } catch (error) {
    fail(res, 'Get most viewed records', error);
  }
};

// Get top ranked records (world records first)
exports.getTopRankedRecords = async (req, res) => {
  try {
    const { limit, offset } = pageParams(req.query);
    const result = await verifiedQuery()
      .eq('record_type', 'world_record')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    send(res, result, limit);
  } catch (error) {
    fail(res, 'Get top ranked records', error);
  }
};

// Get records by category (uuid, slug or name)
exports.getRecordsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit, offset } = pageParams(req.query);
    const result = await withCategory(verifiedQuery(), categoryId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    send(res, result, limit, { category_id: categoryId });
  } catch (error) {
    fail(res, 'Get records by category', error);
  }
};

// Get local records (by location)
exports.getLocalRecords = async (req, res) => {
  try {
    const { country, state, city } = req.query;
    const { limit, offset } = pageParams(req.query);

    let query = verifiedQuery();
    if (country) query = query.eq('country', country);
    if (state) query = query.eq('state', state);
    if (city) query = query.eq('city', city);

    const result = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    send(res, result, limit);
  } catch (error) {
    fail(res, 'Get local records', error);
  }
};

// Admin (route enforces protect + admin): Mark record as featured
exports.toggleFeaturedRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { data, error } = await supabase
      .from('records')
      .update({ is_featured: !!req.body.isFeatured, updated_at: new Date() })
      .eq('id', recordId)
      .select();

    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ message: 'Record not found' });
    return res.status(200).json({ success: true, record: data[0] });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update record visibility
exports.updateRecordVisibility = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { showOnHomepage, showInNewRecords, published } = req.body;

    const updateData = { updated_at: new Date() };
    if (showOnHomepage !== undefined) updateData.show_on_homepage = !!showOnHomepage;
    if (showInNewRecords !== undefined) updateData.show_in_new_records = !!showInNewRecords;
    if (published !== undefined) updateData.published = !!published;

    const { data, error } = await supabase.from('records').update(updateData).eq('id', recordId).select();
    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ message: 'Record not found' });
    res.json({ success: true, record: data[0] });
  } catch (error) {
    console.error('Update visibility error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update record details
exports.updateRecordDetails = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { title, description, categoryId, category } = req.body;

    const updateData = { updated_at: new Date() };
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (categoryId) {
      updateData.category_id = categoryId;
      const { data: cat } = await supabase.from('categories').select('name').eq('id', categoryId).maybeSingle();
      if (cat) updateData.category = cat.name;
    } else if (category) {
      updateData.category = category;
    }

    const { data, error } = await supabase.from('records').update(updateData).eq('id', recordId).select();
    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ message: 'Record not found' });
    res.json({ success: true, record: data[0] });
  } catch (error) {
    console.error('Update record details error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update record video
exports.updateRecordVideo = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { videoUrl, thumbnailUrl } = req.body;

    const updateData = { updated_at: new Date() };
    if (videoUrl) {
      updateData.evidence_url = videoUrl;
      updateData.video_url = videoUrl;
    }
    if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl;

    const { data, error } = await supabase.from('records').update(updateData).eq('id', recordId).select();
    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ message: 'Record not found' });
    res.json({ success: true, record: data[0] });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: Change record status
exports.changeRecordStatus = async (req, res) => {
  try {
    const { recordId } = req.params;
    let { status, notes } = req.body;
    if (status === 'approved') status = 'verified';
    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be pending, verified or rejected' });
    }

    const updateData = { status, updated_at: new Date() };
    if (status === 'verified') updateData.approved_at = new Date();
    if (notes) updateData.admin_notes = notes;

    const { data, error } = await supabase.from('records').update(updateData).eq('id', recordId).select();
    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ message: 'Record not found' });
    res.json({ success: true, record: data[0] });
  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all records with filters and search (public: verified only)
exports.getAllRecords = async (req, res) => {
  try {
    const { search = '', category = '', sortBy = 'newest' } = req.query;
    const { limit, offset } = pageParams(req.query, 60);

    let query = withCategory(withSearch(verifiedQuery(), search), category);

    const sortMap = {
      newest: [['created_at', false]],
      oldest: [['created_at', true]],
      mostViewed: [['views', false], ['created_at', false]],
      mostLiked: [['likes_count', false], ['created_at', false]],
      topRanked: [['likes_count', false], ['views', false]],
    };
    for (const [column, ascending] of sortMap[sortBy] || sortMap.newest) {
      query = query.order(column, { ascending });
    }

    const result = await query.range(offset, offset + limit - 1);
    send(res, result, limit);
  } catch (error) {
    fail(res, 'Get all records', error);
  }
};
