/**
 * Upload Configuration
 * Handles file uploads for videos, thumbnails, evidence, and product images
 * Now integrates directly with Supabase Storage to prevent ephemeral data loss on Render.
 *
 * NOTE: these routes stream the file THROUGH this server. Prefer the direct-to-storage flow
 * (POST /api/uploads/sign) for videos; these limits are kept in line with Supabase's
 * per-file cap (50 MB on the free plan, configurable with MAX_VIDEO_MB).
 */
const MAX_VIDEO_BYTES = (parseInt(process.env.MAX_VIDEO_MB, 10) || 50) * 1024 * 1024;

const multer = require('multer');
const path = require('path');
const supabase = require('./supabase');

function SupabaseStorage(opts) {
  this.getDestination = opts.destination || function(req, file, cb) { cb(null, '') };
  this.getFilename = opts.filename || function(req, file, cb) {
    const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + u + path.extname(file.originalname).toLowerCase());
  };
}

SupabaseStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  this.getDestination(req, file, function(err, destination) {
    if (err) return cb(err);
    this.getFilename(req, file, async function(err, filename) {
      if (err) return cb(err);

      const folderName = destination ? destination.split('/').pop() || 'misc' : 'misc';
      const finalPath = `${folderName}/${filename}`;

      try {
        const chunks = [];
        let failed = false;
        file.stream.on('error', (streamErr) => {
          failed = true;
          cb(streamErr);
        });
        file.stream.on('limit', () => {
          // multer raises LIMIT_FILE_SIZE itself; just make sure the truncated file isn't uploaded
          failed = true;
        });
        file.stream.on('data', chunk => chunks.push(chunk));
        file.stream.on('end', async () => {
          if (failed) return;
          const buffer = Buffer.concat(chunks);

          const { data, error } = await supabase.storage
            .from('uploads')
            .upload(finalPath, buffer, {
              contentType: file.mimetype,
              upsert: false
            });

          if (error) {
            console.error('Supabase upload error:', error);
            const tooBig = /exceeded|too large|maximum allowed size/i.test(error.message || '');
            const friendly = new Error(tooBig ? 'File is too large for storage.' : 'Upload to storage failed. Please try again.');
            if (tooBig) friendly.code = 'LIMIT_FILE_SIZE';
            return cb(friendly);
          }

          const { data: publicData } = supabase.storage
            .from('uploads')
            .getPublicUrl(finalPath);

          cb(null, {
            path: publicData.publicUrl,
            size: buffer.length,
            filename: filename, // Keep the original filename so legacy controllers don't break logic
            url: publicData.publicUrl // Add the full URL here
          });
        });
      } catch (err) {
        cb(err);
      }
    });
  }.bind(this));
};

SupabaseStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  cb(null);
};

// Directories are now just folder prefixes in Supabase bucket
const videosDir = 'videos';
const thumbnailsDir = 'thumbnails';
const evidenceDir = 'evidence';
const imagesDir = 'images';

// ── Storage configs ──────────────────────────────────────────────────────────

const videoStorage = new SupabaseStorage({
  destination: (req, file, cb) => cb(null, videosDir),
});

const thumbnailStorage = new SupabaseStorage({
  destination: (req, file, cb) => cb(null, thumbnailsDir),
});

const evidenceStorage = new SupabaseStorage({
  destination: (req, file, cb) => cb(null, evidenceDir),
});

const productImageStorage = new SupabaseStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'product-' + u + path.extname(file.originalname).toLowerCase());
  },
});

const bannerStorage = new SupabaseStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'banner-' + u + path.extname(file.originalname).toLowerCase());
  },
});

const challengeStorage = new SupabaseStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, thumbnailsDir);
    else cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    const u = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'challenge-' + u + path.extname(file.originalname).toLowerCase());
  },
});

// ── File filters ─────────────────────────────────────────────────────────────

const videoFilter = (req, file, cb) => {
  const allowed = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error(`Invalid video format. Allowed: ${allowed.join(', ')}`), false);
};

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error(`Invalid image format. Allowed: ${allowed.join(', ')}`), false);
};

const productImageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Invalid image format. Allowed: JPG, PNG, WEBP'), false);
};

const evidenceFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo',
  ];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Invalid file format'), false);
};

const challengeFilter = (req, file, cb) => {
  const allowed = [
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm', 'video/x-msvideo',
    'image/jpeg', 'image/png', 'image/webp'
  ];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Invalid format for challenge upload. Allowed: MP4, MOV, WEBM, JPG, PNG, WEBP'), false);
};

// ── Multer instances ─────────────────────────────────────────────────────────

const videoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: MAX_VIDEO_BYTES },
});

const thumbnailUpload = multer({
  storage: thumbnailStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const evidenceUpload = multer({
  storage: evidenceStorage,
  fileFilter: evidenceFilter,
  limits: { fileSize: MAX_VIDEO_BYTES },
});

const productImageUpload = multer({
  storage: productImageStorage,
  fileFilter: productImageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const bannerUpload = multer({
  storage: bannerStorage,
  fileFilter: productImageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const challengeUpload = multer({
  storage: challengeStorage,
  fileFilter: challengeFilter,
  limits: { fileSize: MAX_VIDEO_BYTES },
});

module.exports = {
  videoUpload,
  thumbnailUpload,
  evidenceUpload,
  productImageUpload,
  bannerUpload,
  challengeUpload,
  uploadsDir: 'uploads',
  videosDir: 'videos',
  thumbnailsDir: 'thumbnails',
  evidenceDir: 'evidence',
  imagesDir: 'images',
};
