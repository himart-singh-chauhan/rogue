const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getAllCouponsByAdmin,
  createCouponByAdmin,
  updateCouponByAdmin,
  deleteCouponByAdmin,
  getCouponStatsByAdmin
} = require('../controllers/couponController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

// Public route for validating coupon codes during checkout
router.post('/validate', optionalAuth, validateCoupon);

// Admin-only coupon management routes
router.use(protect);
router.use(admin);

router.get('/', getAllCouponsByAdmin);
router.get('/stats', getCouponStatsByAdmin);
router.post('/', createCouponByAdmin);
router.put('/:id', updateCouponByAdmin);
router.delete('/:id', deleteCouponByAdmin);

module.exports = router;
