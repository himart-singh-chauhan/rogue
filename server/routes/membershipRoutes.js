const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  requestMembership,
  activateMembership,
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

// A logged-in user asks for a paid plan. Saved as PENDING (nothing is granted or charged)
// until an admin confirms payment, or the Stripe webhook does once Stripe is connected.
router.post('/request', protect, requestMembership);

// Admin-only. Creating a membership is admin-only until a real payment gateway
// (Razorpay / Stripe) confirms payment; otherwise anyone could grant themselves a paid tier.
router.get('/stats/overview', protect, admin, getMembershipStats);
router.get('/', protect, admin, getAllMemberships);
router.post('/', protect, admin, createMembership);
router.put('/:id', protect, admin, updateMembership);
router.put('/:id/change-tier', protect, admin, changeMembershipTier);
router.put('/:id/renew', protect, admin, renewMembership);
router.put('/:id/activate', protect, admin, activateMembership);
router.put('/:id/cancel', protect, admin, cancelMembership);
router.get('/:id/payments', protect, admin, getPaymentHistory);

module.exports = router;
