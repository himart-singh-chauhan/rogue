const express = require('express');
const { getGlobalRankings, getLocalRankings, getCategoryRankings, getUserRankingDetails, addUserPoints, adjustUserPoints, recalculateAllRankings, getPointsRules, updatePointsRule } = require('../controllers/rankingController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/global', getGlobalRankings);
router.get('/local', getLocalRankings);
router.get('/category/:category_id', getCategoryRankings);
router.get('/user/:user_id', getUserRankingDetails);
router.get('/rules', getPointsRules);

// Admin-only routes
router.post('/points', protect, admin, addUserPoints);
router.post('/adjust-points', protect, admin, adjustUserPoints);
router.put('/rules/:rule_name', protect, admin, updatePointsRule);
router.post('/recalculate', protect, admin, recalculateAllRankings);

module.exports = router;
