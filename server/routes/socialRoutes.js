const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.post('/:recordId/like', protect, socialController.toggleLike);
router.post('/:recordId/view', socialController.incrementView);
router.post('/:recordId/comment', protect, socialController.addComment);
// optionalAuth: logged-in visitors also get isLiked
router.get('/:recordId', optionalAuth, socialController.getSocialStats);

module.exports = router;
