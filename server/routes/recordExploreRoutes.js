const express = require('express');
const router = express.Router();
const recordExploreController = require('../controllers/recordExploreController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes for exploring records
router.get('/homepage-sections', recordExploreController.getHomepageSections);
router.get('/new', recordExploreController.getNewRecords);
router.get('/featured', recordExploreController.getFeaturedRecords);
router.get('/viewed', recordExploreController.getMostViewedRecords);
router.get('/ranked', recordExploreController.getTopRankedRecords);
router.get('/category/:categoryId', recordExploreController.getRecordsByCategory);
router.get('/local', recordExploreController.getLocalRecords);
router.get('/all', recordExploreController.getAllRecords);

// Admin routes for record management
router.put('/admin/featured/:recordId', protect, admin, recordExploreController.toggleFeaturedRecord);
router.put('/admin/visibility/:recordId', protect, admin, recordExploreController.updateRecordVisibility);
router.put('/admin/details/:recordId', protect, admin, recordExploreController.updateRecordDetails);
router.put('/admin/video/:recordId', protect, admin, recordExploreController.updateRecordVideo);
router.put('/admin/status/:recordId', protect, admin, recordExploreController.changeRecordStatus);

module.exports = router;
