const supabase = require('../config/supabase');

// ==========================================
// 🏆 CHALLENGES CRUD
// ==========================================

// @desc    Get all challenges
// @route   GET /api/admin/challenges
const getChallenges = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('record_type', 'challenge')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a new challenge
// @route   POST /api/admin/challenges (multipart/form-data)
const createChallenge = async (req, res) => {
  const {
    title, athleteId, description, status, isFeatured, videoType, youtubeUrl
  } = req.body;

  try {
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    let finalVideoUrl = null;
    let finalThumbnailUrl = null;

    if (videoType === 'youtube') {
      finalVideoUrl = youtubeUrl;
    } else if (req.files && req.files.videoFile && req.files.videoFile[0]) {
      finalVideoUrl = req.files.videoFile[0].url || `${baseUrl}/uploads/videos/${req.files.videoFile[0].filename}`;
    } else if (req.body.videoUrl) {
      // already uploaded straight to storage via /api/uploads/sign
      finalVideoUrl = req.body.videoUrl;
    }

    if (req.files && req.files.thumbnailImage && req.files.thumbnailImage[0]) {
      finalThumbnailUrl = req.files.thumbnailImage[0].url || `${baseUrl}/uploads/thumbnails/${req.files.thumbnailImage[0].filename}`;
    } else if (req.body.thumbnailUrl) {
      finalThumbnailUrl = req.body.thumbnailUrl;
    }

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const { data: newChallenge, error } = await supabase
      .from('records')
      .insert([{
        record_type: 'challenge',
        title,
        athlete_id: athleteId || 'Unknown Athlete',
        description,
        category: 'Challenge', // default category
        value: 'N/A', // default value
        unit: 'N/A', // default unit
        evidence_url: finalVideoUrl || '', // fallback
        status: status || 'pending',
        is_featured: isFeatured === 'true' || isFeatured === true,
        video_type: videoType || 'upload',
        video_url: finalVideoUrl,
        thumbnail_url: finalThumbnailUrl,
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Challenge saved successfully.', challenge: newChallenge });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ error: 'Challenge could not be saved. Please check the required fields.' });
  }
};

// @desc    Update a challenge
// @route   PUT /api/admin/challenges/:id (multipart/form-data)
const updateChallenge = async (req, res) => {
  const { id } = req.params;
  const {
    title, athleteId, description, status, isFeatured, videoType, youtubeUrl
  } = req.body;

  try {
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const updateData = { updated_at: new Date() };

    if (title !== undefined) updateData.title = title;
    if (athleteId !== undefined) updateData.athlete_id = athleteId;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (isFeatured !== undefined) updateData.is_featured = isFeatured === 'true' || isFeatured === true;
    if (videoType !== undefined) updateData.video_type = videoType;

    if (videoType === 'youtube') {
      updateData.video_url = youtubeUrl;
      updateData.evidence_url = youtubeUrl;
    } else if (req.files && req.files.videoFile && req.files.videoFile[0]) {
      const url = req.files.videoFile[0].url || `${baseUrl}/uploads/videos/${req.files.videoFile[0].filename}`;
      updateData.video_url = url;
      updateData.evidence_url = url;
    } else if (req.body.videoUrl) {
      updateData.video_url = req.body.videoUrl;
      updateData.evidence_url = req.body.videoUrl;
    }

    if (req.files && req.files.thumbnailImage && req.files.thumbnailImage[0]) {
      updateData.thumbnail_url = req.files.thumbnailImage[0].url || `${baseUrl}/uploads/thumbnails/${req.files.thumbnailImage[0].filename}`;
    } else if (req.body.thumbnailUrl) {
      updateData.thumbnail_url = req.body.thumbnailUrl;
    } else if (req.body.removeThumbnail === 'true' || req.body.removeThumbnail === true) {
      updateData.thumbnail_url = null;
    }

    const { data: updatedChallenge, error } = await supabase
      .from('records')
      .update(updateData)
      .eq('id', id)
      .eq('record_type', 'challenge')
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ message: 'Challenge saved successfully.', challenge: updatedChallenge });
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({ error: 'Challenge could not be saved. Please check the required fields.' });
  }
};

// @desc    Delete a challenge
// @route   DELETE /api/admin/challenges/:id
const deleteChallenge = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', id)
      .eq('record_type', 'challenge');

    if (error) throw error;
    res.status(200).json({ message: 'Challenge deleted successfully.' });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Toggle feature status
// @route   PUT /api/admin/challenges/:id/feature
const toggleFeatureChallenge = async (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;

  try {
    const { data, error } = await supabase
      .from('records')
      .update({ is_featured: isFeatured, updated_at: new Date() })
      .eq('id', id)
      .eq('record_type', 'challenge')
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ message: 'Challenge feature status updated.', challenge: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  toggleFeatureChallenge
};
