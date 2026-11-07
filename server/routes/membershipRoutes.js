const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getTierConfigs,
  getAllMemberships,
  getUserMembership,
  createMembership,
  updateMembership,
  changeMembershipTier,
  renewMembership,
  cancelMembership,
  getMembershipStats,
  getPaymentHistory
} = require('../controllers/membershipController');

// Public routes
router.get('/tiers', getTierConfigs);

// A user may read their own membership (ownership is checked in the controller).
router.get('/user/:userId', protect, getUserMembership);

// Admin-only. Creating a membership is admin-only until a real payment gateway
// (Razorpay / Stripe) confirms payment; otherwise anyone could grant themselves a paid tier.
router.get('/stats/overview', protect, admin, getMembershipStats);
router.get('/', protect, admin, getAllMemberships);
router.post('/', protect, admin, createMembership);
router.put('/:id', protect, admin, updateMembership);
router.put('/:id/change-tier', protect, admin, changeMembershipTier);
router.put('/:id/renew', protect, admin, renewMembership);
router.put('/:id/cancel', protect, admin, cancelMembership);
router.get('/:id/payments', protect, admin, getPaymentHistory);

module.exports = router;
