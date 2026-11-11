const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const rewards = require('../controllers/rewardsController');

// Member: "My Rewards" dashboard and the cart's reward-discount preview
router.get('/me', protect, rewards.getMyRewards);
router.post('/quote', optionalAuth, rewards.quote);

module.exports = router;
