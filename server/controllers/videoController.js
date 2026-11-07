/**
 * Video Admin Controller
 * Handles admin operations for managing videos, thumbnails, and video metadata
 */

const Video = require('../models/Video');
const { extractYouTubeVideoId, generateYouTubeThumbnailUrl } = require('../utils/youtubeIntegration');

// Shared normaliser for admin-created featured / newest videos.
// Detects YouTube links (source + id + thumbnail) so admins can paste a link without a thumbnail.
const buildVideoInput = (body, videoType, defaultTitle, userId) => {
  const ytId = body.youtubeVideoId || extractYouTubeVideoId(body.videoUrl);
  const isYouTube = !!ytId;
  return {
    recordId: body.recordId || null,
    userId,
    videoType,
    title: body.title || defaultTitle,
    description: body.description,
    videoUrl: body.videoUrl,
    thumbnailUrl: body.thumbnailUrl || (isYouTube ? generateYouTubeThumbnailUrl(ytId) : null),
    source: body.source || (isYouTube ? 'youtube' : 'uploaded'),
    youtubeVideoId: ytId || null,
    duration: body.duration,
    isPublished: body.isPublished !== undefined ? !!body.isPublished : true,
    category: body.category,
    isFeatured: body.isFeatured,
    isNewlyUploaded: body.isNewlyUploaded,
  };
};
const Evidence = require('../models/Evidence');

// ==========================================
// 🎬 RECORD VIDEOS MANAGEMENT
// ==========================================

// @desc    Get all record videos
// @route   GET /api/admin/videos/record
// @access  Private/Admin
const getRecordVideos = async (req, res) => {
  try {
    const { data, error } = await Video.getVideos({
      videoType: Video.VIDEO_TYPES.RECORD,
    });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new record video
// @route   POST /api/admin/videos/record
// @access  Private/Admin
const createRecordVideo = async (req, res) => {
  try {
    const {
      recordId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      source,
      youtubeVideoId,
      duration,
      isPublished,
    } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: 'videoUrl is required' });
    }

    const { data, error } = await Video.createVideo({
      recordId,
      userId: req.user.id,
      videoType: Video.VIDEO_TYPES.RECORD,
      title: title || 'Record Video',
      description,
      videoUrl,
      thumbnailUrl,
      source: source || Video.VIDEO_SOURCES.UPLOADED,
      youtubeVideoId,
      duration,
      isPublished: isPublished !== false,
    });

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a record video
// @route   PUT /api/admin/videos/record/:id
// @access  Private/Admin
const updateRecordVideo = async (req, res) => {
  try {
    const { title, description, videoUrl, thumbnailUrl, duration, isPublished } = req.body;

    const { data, error } = await Video.updateVideo(req.params.id, {
      title,
      description,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      duration,
      is_published: isPublished,
    });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a record video
// @route   DELETE /api/admin/videos/record/:id
// @access  Private/Admin
const deleteRecordVideo = async (req, res) => {
  try {
    const { error } = await Video.deleteVideo(req.params.id);

    if (error) throw error;
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 🎥 ATTEMPT VIDEOS MANAGEMENT
// ==========================================

// @desc    Get all attempt videos
// @route   GET /api/admin/videos/attempt
// @access  Private/Admin
const getAttemptVideos = async (req, res) => {
  try {
    const { data, error } = await Video.getVideos({
      videoType: Video.VIDEO_TYPES.ATTEMPT,
    });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new attempt video
// @route   POST /api/admin/videos/attempt
// @access  Private/Admin
const createAttemptVideo = async (req, res) => {
  try {
    const {
      attemptId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      source,
      youtubeVideoId,
      duration,
    } = req.body;

    if (!attemptId || !videoUrl) {
      return res.status(400).json({ message: 'attemptId and videoUrl are required' });
    }

    const { data, error } = await Video.createVideo({
      attemptId,
      userId: req.user.id,
      videoType: Video.VIDEO_TYPES.ATTEMPT,
      title: title || 'Attempt Video',
      description,
      videoUrl,
      thumbnailUrl,
      source: source || Video.VIDEO_SOURCES.UPLOADED,
      youtubeVideoId,
      duration,
      isPublished: true,
    });

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an attempt video
// @route   DELETE /api/admin/videos/attempt/:id
// @access  Private/Admin
const deleteAttemptVideo = async (req, res) => {
  try {
    const { error } = await Video.deleteVideo(req.params.id);

    if (error) throw error;
    res.json({ message: 'Attempt video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// ⭐ FEATURED VIDEOS MANAGEMENT
// ==========================================

// @desc    Get all featured videos
// @route   GET /api/admin/videos/featured
// @access  Private/Admin
const getFeaturedVideos = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filters = { videoType: Video.VIDEO_TYPES.FEATURED };
    // Visitors only see published videos; admins see everything.
    if (!(req.user && req.user.is_admin)) filters.isPublished = true;
    const { data, error } = await Video.getVideos(filters);

    if (error) throw error;
    res.json((data || []).slice(0, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a featured video
// @route   POST /api/admin/videos/featured
// @access  Private/Admin
const createFeaturedVideo = async (req, res) => {
  try {
    const {
      recordId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      source,
      youtubeVideoId,
      duration,
    } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: 'videoUrl is required' });
    }

    const { data, error } = await Video.createVideo(
      buildVideoInput(req.body, Video.VIDEO_TYPES.FEATURED, 'Featured Video', req.user.id)
    );

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a featured video
// @route   DELETE /api/admin/videos/featured/:id
// @access  Private/Admin
const deleteFeaturedVideo = async (req, res) => {
  try {
    const { error } = await Video.deleteVideo(req.params.id);

    if (error) throw error;
    res.json({ message: 'Featured video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 🆕 NEWEST RECORDS VIDEOS MANAGEMENT
// ==========================================

// @desc    Get newest record videos
// @route   GET /api/admin/videos/newest
// @access  Private/Admin
const getNewestRecordVideos = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const { data, error } = await Video.getNewestRecordVideos(limit);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a newest record video
// @route   POST /api/admin/videos/newest
// @access  Private/Admin
const createNewestRecordVideo = async (req, res) => {
  try {
    const {
      recordId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      source,
      youtubeVideoId,
      duration,
    } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: 'videoUrl is required' });
    }

    const { data, error } = await Video.createVideo(
      buildVideoInput(req.body, Video.VIDEO_TYPES.NEWEST_RECORD, 'Newest Record', req.user.id)
    );

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a newest record video
// @route   DELETE /api/admin/videos/newest/:id
// @access  Private/Admin
const deleteNewestRecordVideo = async (req, res) => {
  try {
    const { error } = await Video.deleteVideo(req.params.id);

    if (error) throw error;
    res.json({ message: 'Newest record video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 🖼️ THUMBNAILS MANAGEMENT
// ==========================================

// @desc    Update video thumbnail
// @route   PUT /api/admin/videos/:id/thumbnail
// @access  Private/Admin
const updateVideoThumbnail = async (req, res) => {
  try {
    const { thumbnailUrl } = req.body;

    if (!thumbnailUrl) {
      return res.status(400).json({ message: 'thumbnailUrl is required' });
    }

    const { data, error } = await Video.updateVideo(req.params.id, {
      thumbnail_url: thumbnailUrl,
    });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 📷 PHOTO EVIDENCE MANAGEMENT
// ==========================================

// @desc    Get all photo evidence
// @route   GET /api/admin/evidence/photos
// @access  Private/Admin
const getAllPhotoEvidence = async (req, res) => {
  try {
    const { data, error } = await Evidence.getEvidence({
      evidenceType: Evidence.EVIDENCE_TYPES.PHOTO,
    });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create photo evidence
// @route   POST /api/admin/evidence/photos
// @access  Private/Admin
const createPhotoEvidence = async (req, res) => {
  try {
    const { recordId, userId, title, description, fileUrl, fileName, fileSize, mimeType } =
      req.body;

    if (!recordId || !fileUrl) {
      return res.status(400).json({ message: 'recordId and fileUrl are required' });
    }

    const { data, error } = await Evidence.createEvidence({
      recordId,
      userId,
      evidenceType: Evidence.EVIDENCE_TYPES.PHOTO,
      title: title || 'Photo Evidence',
      description,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      status: Evidence.EVIDENCE_STATUS.PENDING,
    });

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify photo evidence
// @route   PUT /api/admin/evidence/photos/:id/verify
// @access  Private/Admin
const verifyPhotoEvidence = async (req, res) => {
  try {
    const { verificationNotes } = req.body;

    const { data, error } = await Evidence.verifyEvidence(
      req.params.id,
      req.user.id,
      verificationNotes
    );

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject photo evidence
// @route   PUT /api/admin/evidence/photos/:id/reject
// @access  Private/Admin
const rejectPhotoEvidence = async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'rejectionReason is required' });
    }

    const { data, error } = await Evidence.rejectEvidence(
      req.params.id,
      req.user.id,
      rejectionReason
    );

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete photo evidence
// @route   DELETE /api/admin/evidence/photos/:id
// @access  Private/Admin
const deletePhotoEvidence = async (req, res) => {
  try {
    const { error } = await Evidence.deleteEvidence(req.params.id);

    if (error) throw error;
    res.json({ message: 'Photo evidence deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 📊 VIDEO STATS & ANALYTICS
// ==========================================

// @desc    Get video statistics
// @route   GET /api/admin/videos/stats
// @access  Private/Admin
const getVideoStats = async (req, res) => {
  try {
    const { data: allVideos, error: videosError } = await Video.getVideos({});

    if (videosError) throw videosError;

    const stats = {
      total: allVideos.length,
      byType: {
        record: allVideos.filter((v) => v.video_type === Video.VIDEO_TYPES.RECORD).length,
        attempt: allVideos.filter((v) => v.video_type === Video.VIDEO_TYPES.ATTEMPT).length,
        featured: allVideos.filter((v) => v.video_type === Video.VIDEO_TYPES.FEATURED).length,
        newestRecord: allVideos.filter((v) => v.video_type === Video.VIDEO_TYPES.NEWEST_RECORD)
          .length,
      },
      bySource: {
        uploaded: allVideos.filter((v) => v.source === Video.VIDEO_SOURCES.UPLOADED).length,
        youtube: allVideos.filter((v) => v.source === Video.VIDEO_SOURCES.YOUTUBE).length,
        externalUrl: allVideos.filter((v) => v.source === Video.VIDEO_SOURCES.EXTERNAL_URL)
          .length,
      },
      published: allVideos.filter((v) => v.is_published).length,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRecordVideos,
  createRecordVideo,
  updateRecordVideo,
  deleteRecordVideo,
  getAttemptVideos,
  createAttemptVideo,
  deleteAttemptVideo,
  getFeaturedVideos,
  createFeaturedVideo,
  deleteFeaturedVideo,
  getNewestRecordVideos,
  createNewestRecordVideo,
  deleteNewestRecordVideo,
  updateVideoThumbnail,
  getAllPhotoEvidence,
  createPhotoEvidence,
  verifyPhotoEvidence,
  rejectPhotoEvidence,
  deletePhotoEvidence,
  getVideoStats,
};
