/**
 * Video Model
 * Manages videos related to records, attempts, featured content, and newest records
 */

const supabase = require('../config/supabase');

// Video types
const VIDEO_TYPES = {
  RECORD: 'record', // Video evidence for a record submission
  ATTEMPT: 'attempt', // Video of an attempt/challenge
  FEATURED: 'featured', // Featured video for homepage/display
  NEWEST_RECORD: 'newest_record', // Video showcasing the newest record
  ATTEMPT_HISTORY: 'attempt_history', // Historical video from attempt history
};

// Video sources
const VIDEO_SOURCES = {
  UPLOADED: 'uploaded', // Direct upload
  YOUTUBE: 'youtube', // YouTube integration
  EXTERNAL_URL: 'external_url', // External URL link
};

// Create a new video record
const createVideo = async (videoData) => {
  try {
    const {
      recordId,
      attemptId,
      userId,
      videoType, // One of VIDEO_TYPES
      title,
      description,
      videoUrl,
      thumbnailUrl,
      source, // One of VIDEO_SOURCES
      youtubeVideoId, // For YouTube videos
      duration, // Duration in seconds
      isPublished = true,
      category,
      isFeatured,
      isNewlyUploaded,
    } = videoData;

    // Featured / newest videos are standalone; they no longer get attached to an arbitrary record.
    const finalRecordId = recordId || null;

    const { data, error } = await supabase
      .from('videos')
      .insert({
        record_id: finalRecordId,
        attempt_id: attemptId || null,
        user_id: userId || null,
        video_type: videoType,
        title,
        description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        source,
        youtube_video_id: youtubeVideoId,
        duration: duration ? parseInt(duration, 10) || null : null,
        is_published: isPublished,
        category: category || null,
        is_featured: isFeatured !== undefined ? !!isFeatured : videoType === VIDEO_TYPES.FEATURED,
        is_newly_uploaded: isNewlyUploaded !== undefined ? !!isNewlyUploaded : videoType === VIDEO_TYPES.NEWEST_RECORD,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get all videos with filters
const getVideos = async (filters = {}) => {
  try {
    let query = supabase.from('videos').select('*');

    if (filters.recordId) {
      query = query.eq('record_id', filters.recordId);
    }
    if (filters.attemptId) {
      query = query.eq('attempt_id', filters.attemptId);
    }
    if (filters.videoType) {
      query = query.eq('video_type', filters.videoType);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.isPublished !== undefined) {
      query = query.eq('is_published', filters.isPublished);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get a single video by ID
const getVideoById = async (videoId) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Update a video
const updateVideo = async (videoId, updates) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .update({
        ...updates,
        updated_at: new Date(),
      })
      .eq('id', videoId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Delete a video
const deleteVideo = async (videoId) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get featured videos
const getFeaturedVideos = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('video_type', VIDEO_TYPES.FEATURED)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Get newest record videos
const getNewestRecordVideos = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('video_type', VIDEO_TYPES.NEWEST_RECORD)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

module.exports = {
  createVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  getFeaturedVideos,
  getNewestRecordVideos,
  VIDEO_TYPES,
  VIDEO_SOURCES,
};
