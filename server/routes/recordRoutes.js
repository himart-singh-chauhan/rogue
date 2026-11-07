const express = require('express');
const router = express.Router();
const {
  getRecords,
  getRecordById,
  createRecord,
  getLeaderboard,
  getMySubmissions,
  getAllSubmissionsForAdmin,
  adjudicateRecord,
  processCheckout,
  toggleRecordFeatured,
} = require('../controllers/recordController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');
const { thumbnailUpload, videoUpload } = require('../config/upload');
const { uploadThumbnail, uploadVideoFile } = require('../controllers/videoUploadController');

router.get('/', getRecords);
router.get('/leaderboard', getLeaderboard);
router.get('/my-submissions', protect, getMySubmissions);

// Admin Routes (placed before dynamic route :id to prevent parameter hijacking)
router.get('/admin/submissions', protect, admin, getAllSubmissionsForAdmin);
router.put('/admin/adjudicate/:id', protect, admin, adjudicateRecord);
router.put('/:id/featured', protect, admin, toggleRecordFeatured);

// File upload routes for regular users submitting records
router.post('/upload/image', protect, thumbnailUpload.single('image'), uploadThumbnail);
router.post('/upload/video', protect, videoUpload.single('video'), uploadVideoFile);

router.get('/:id', optionalAuth, getRecordById);
router.post('/', protect, createRecord);
router.post('/:id/checkout', protect, processCheckout);

module.exports = router;
