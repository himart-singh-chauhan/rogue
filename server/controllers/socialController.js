const supabase = require('../config/supabase');

// Likes, comments and views now live in the database (record_likes, record_comments and
// counter columns on records maintained by triggers). They used to live in data/social.json,
// which was wiped on every Render deploy.

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));

const formatComment = (c) => ({
  id: c.id,
  userId: c.user_id,
  userName: c.users?.name || c.users?.username || 'Athlete',
  userAvatar: c.users?.profile_image || '',
  text: c.text,
  createdAt: c.created_at,
});

// Toggle like for a record
exports.toggleLike = async (req, res) => {
  try {
    const { recordId } = req.params;
    if (!isUUID(recordId)) return res.status(404).json({ message: 'Record not found' });
    const userId = req.user.id;

    const { data: existing, error: findError } = await supabase
      .from('record_likes')
      .select('record_id')
      .eq('record_id', recordId)
      .eq('user_id', userId)
      .maybeSingle();
    if (findError) throw findError;

    let isLiked;
    if (existing) {
      const { error } = await supabase.from('record_likes').delete().eq('record_id', recordId).eq('user_id', userId);
      if (error) throw error;
      isLiked = false;
    } else {
      const { error } = await supabase.from('record_likes').insert([{ record_id: recordId, user_id: userId }]);
      if (error && error.code !== '23505') throw error; // 23505 = already liked (double click)
      isLiked = true;
    }

    const { data: rec } = await supabase.from('records').select('likes_count').eq('id', recordId).maybeSingle();
    res.json({ success: true, likes: rec?.likes_count || 0, isLiked });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Could not update like' });
  }
};

// Increment views for a record (atomic SQL function)
exports.incrementView = async (req, res) => {
  try {
    const { recordId } = req.params;
    if (!isUUID(recordId)) return res.status(404).json({ message: 'Record not found' });
    const { data, error } = await supabase.rpc('increment_record_view', { p_record_id: recordId });
    if (error) throw error;
    res.json({ success: true, views: data || 0 });
  } catch (error) {
    console.error('Increment view error:', error);
    res.status(500).json({ message: 'Could not record view' });
  }
};

// Add a comment to a record
exports.addComment = async (req, res) => {
  try {
    const { recordId } = req.params;
    if (!isUUID(recordId)) return res.status(404).json({ message: 'Record not found' });
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    if (text.length > 1000) {
      return res.status(400).json({ message: 'Comments are limited to 1000 characters' });
    }

    const { data, error } = await supabase
      .from('record_comments')
      .insert([{ record_id: recordId, user_id: req.user.id, text }])
      .select('id, user_id, text, created_at, users(name, username, profile_image)')
      .single();
    if (error) throw error;

    res.status(201).json({ success: true, comment: formatComment(data) });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Could not add comment' });
  }
};

// Get social stats for a single record
exports.getSocialStats = async (req, res) => {
  try {
    const { recordId } = req.params;
    if (!isUUID(recordId)) return res.json({ views: 0, likes: 0, isLiked: false, comments: [] });
    const userId = req.user ? req.user.id : null;

    const [{ data: rec }, { data: comments }, likeResult] = await Promise.all([
      supabase.from('records').select('views, likes_count').eq('id', recordId).maybeSingle(),
      supabase
        .from('record_comments')
        .select('id, user_id, text, created_at, users(name, username, profile_image)')
        .eq('record_id', recordId)
        .order('created_at', { ascending: true })
        .limit(200),
      userId
        ? supabase.from('record_likes').select('record_id').eq('record_id', recordId).eq('user_id', userId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    res.json({
      views: rec?.views || 0,
      likes: rec?.likes_count || 0,
      isLiked: !!likeResult?.data,
      comments: (comments || []).map(formatComment),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Could not load social stats' });
  }
};

// Used by other controllers: counters are columns on records, so this is a cheap mapping.
exports.mergeSocialStats = (records) =>
  (records || []).map((r) => ({
    ...r,
    views: r.views || 0,
    likes: r.likes_count || 0,
    commentsCount: r.comments_count || 0,
  }));

exports.mergeSingleSocialStats = (record) => ({
  ...record,
  views: record.views || 0,
  likes: record.likes_count || 0,
  commentsCount: record.comments_count || 0,
});
