const crypto = require('crypto');
const path = require('path');
const supabase = require('../config/supabase');

// Direct-to-storage uploads.
// The browser asks this endpoint for a short-lived signed upload URL, then sends the file
// straight to Supabase Storage. Files never pass through (or get buffered by) this server,
// which removes the memory crashes and timeouts large videos caused on Render.

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
const MB = 1024 * 1024;
// Supabase free plan caps a single file at 50 MB. Raise MAX_VIDEO_MB after upgrading the plan.
const MAX_VIDEO = (parseInt(process.env.MAX_VIDEO_MB, 10) || 50) * MB;

const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOC_TYPES = ['application/pdf'];

// kind -> rules. adminOnly kinds require an admin session.
const KINDS = {
  'record-video': { folder: 'videos', types: VIDEO_TYPES, max: MAX_VIDEO },
  'record-image': { folder: 'thumbnails', types: IMAGE_TYPES, max: 10 * MB },
  evidence: { folder: 'evidence', types: [...IMAGE_TYPES, ...VIDEO_TYPES, ...DOC_TYPES], max: MAX_VIDEO },
  avatar: { folder: 'avatars', types: IMAGE_TYPES, max: 5 * MB },
  'admin-video': { folder: 'videos', types: VIDEO_TYPES, max: MAX_VIDEO, adminOnly: true },
  'admin-image': { folder: 'images', types: IMAGE_TYPES, max: 10 * MB, adminOnly: true },
};

const EXT_BY_TYPE = {
  'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'application/pdf': '.pdf',
};

const describeTypes = (types) => types.map((t) => (EXT_BY_TYPE[t] || t).replace('.', '').toUpperCase()).join(', ');

// @desc    Get a signed URL for uploading one file directly to storage
// @route   POST /api/uploads/sign
// @access  Private
const signUpload = async (req, res) => {
  try {
    const { kind, fileName = '', contentType = '', size } = req.body || {};
    const rules = KINDS[kind];
    if (!rules) {
      return res.status(400).json({ message: `Unknown upload kind. Use one of: ${Object.keys(KINDS).join(', ')}` });
    }
    if (rules.adminOnly && !req.user.is_admin) {
      return res.status(403).json({ message: 'Only admins can upload this file type' });
    }
    if (!rules.types.includes(contentType)) {
      return res.status(400).json({ message: `Unsupported file type. Allowed: ${describeTypes(rules.types)}` });
    }
    const bytes = Number(size);
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return res.status(400).json({ message: 'File size is required' });
    }
    if (bytes > rules.max) {
      return res.status(413).json({ message: `File is too large. Maximum size is ${Math.round(rules.max / MB)} MB.` });
    }

    const ext = EXT_BY_TYPE[contentType] || path.extname(String(fileName)).toLowerCase().slice(0, 8);
    const objectPath = `${rules.folder}/${req.user.id}/${Date.now()}-${crypto.randomUUID()}${ext}`;

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(objectPath);
    if (error) {
      console.error('createSignedUploadUrl failed:', error.message);
      return res.status(500).json({ message: 'Storage is not available right now. Please try again.' });
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

    res.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: objectPath,
      publicUrl: publicData.publicUrl,
      maxBytes: rules.max,
      // The publishable/anon key is public by design; the storage gateway expects it on requests.
      apiKey: process.env.SUPABASE_ANON_KEY || undefined,
    });
  } catch (error) {
    console.error('signUpload error:', error);
    res.status(500).json({ message: 'Could not prepare the upload' });
  }
};

// @desc    Upload limits, so the UI can show correct hints
// @route   GET /api/uploads/limits
// @access  Public
const getUploadLimits = (req, res) => {
  const out = {};
  for (const [kind, r] of Object.entries(KINDS)) {
    out[kind] = { maxMB: Math.round(r.max / MB), types: r.types, adminOnly: !!r.adminOnly };
  }
  res.json(out);
};

module.exports = { signUpload, getUploadLimits, KINDS };
