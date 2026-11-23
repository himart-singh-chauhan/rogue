const express = require('express');
const router = express.Router();
const {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getPublicUserProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  guardianApprove,
} = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.post('/login', authUser);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/guardian-approve', guardianApprove);
router.post('/resend-verification', protect, resendVerification);
router.post('/register', registerUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/profile/:username', optionalAuth, getPublicUserProfile);

module.exports = router;
