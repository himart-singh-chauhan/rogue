/**
 * YouTube Integration Helper
 * Utilities for extracting YouTube video IDs, validating URLs, and generating embeds
 */

/**
 * Extract YouTube video ID from various YouTube URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if invalid
 */
const extractYouTubeVideoId = (url) => {
  if (!url) return null;

  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // If it's just an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
};

/**
 * Generate YouTube embed URL from video ID
 * @param {string} videoId - YouTube video ID
 * @returns {string} - Embed URL
 */
const generateYouTubeEmbedUrl = (videoId) => {
  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Generate YouTube watch URL from video ID
 * @param {string} videoId - YouTube video ID
 * @returns {string} - Watch URL
 */
const generateYouTubeWatchUrl = (videoId) => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};

/**
 * Generate YouTube thumbnail URL from video ID
 * @param {string} videoId - YouTube video ID
 * @param {string} quality - Thumbnail quality: maxresdefault, sddefault, hqdefault, mqdefault, default
 * @returns {string} - Thumbnail URL
 */
const generateYouTubeThumbnailUrl = (videoId, quality = 'hqdefault') => {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Fetch YouTube video metadata using YouTube Data API v3
 * Note: Requires YouTube API key in environment variables
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} - Video metadata or null if fetch fails
 */
const fetchYouTubeMetadata = async (videoId) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      console.warn('YOUTUBE_API_KEY not configured. Skipping metadata fetch.');
      return null;
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const video = data.items[0];
    const snippet = video.snippet || {};
    const contentDetails = video.contentDetails || {};
    const statistics = video.statistics || {};

    // Parse ISO 8601 duration to seconds
    const parseDuration = (duration) => {
      const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
      const matches = duration.match(regex);

      let seconds = 0;
      if (matches[1]) seconds += parseInt(matches[1]) * 3600; // hours
      if (matches[2]) seconds += parseInt(matches[2]) * 60; // minutes
      if (matches[3]) seconds += parseInt(matches[3]); // seconds

      return seconds;
    };

    return {
      videoId,
      title: snippet.title,
      description: snippet.description,
      thumbnail: snippet.thumbnails?.high?.url || generateYouTubeThumbnailUrl(videoId),
      duration: parseDuration(contentDetails.duration),
      viewCount: parseInt(statistics.viewCount || 0),
      likeCount: parseInt(statistics.likeCount || 0),
      commentCount: parseInt(statistics.commentCount || 0),
      channel: snippet.channelTitle,
      publishedAt: snippet.publishedAt,
    };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    return null;
  }
};

/**
 * Validate if a URL is a valid YouTube URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid YouTube URL
 */
const isValidYouTubeUrl = (url) => {
  return extractYouTubeVideoId(url) !== null;
};

/**
 * Convert YouTube watch URL to embed URL
 * @param {string} watchUrl - YouTube watch URL
 * @returns {string|null} - Embed URL or null if invalid
 */
const convertYouTubeWatchToEmbed = (watchUrl) => {
  const videoId = extractYouTubeVideoId(watchUrl);
  if (!videoId) return null;
  return generateYouTubeEmbedUrl(videoId);
};

module.exports = {
  extractYouTubeVideoId,
  generateYouTubeEmbedUrl,
  generateYouTubeWatchUrl,
  generateYouTubeThumbnailUrl,
  fetchYouTubeMetadata,
  isValidYouTubeUrl,
  convertYouTubeWatchToEmbed,
};

// Thumbnail to store for a record/video: the uploaded one, else YouTube's own frame, else empty.
module.exports.thumbnailFor = (videoUrl, uploadedThumbnail) => {
  if (uploadedThumbnail && uploadedThumbnail !== 'pending_upload') return uploadedThumbnail;
  const id = module.exports.extractYouTubeVideoId(videoUrl || '');
  return id ? module.exports.generateYouTubeThumbnailUrl(id) : '';
};
