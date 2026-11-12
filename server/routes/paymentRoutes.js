const express = require('express');
const router = express.Router();
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');
const payments = require('../controllers/paymentController');

// Stripe calls this; it is checked with the webhook signing secret (raw body kept in index.js).
router.post('/stripe/webhook', payments.stripeWebhook);

// The buyer's return page reads the result of their checkout.
router.get('/stripe/session/:sessionId', optionalAuth, payments.getSessionStatus);
router.post('/stripe/cancel/:paymentId', optionalAuth, payments.cancelPayment);

// A member's Stripe billing page (update card, invoices, cancel the subscription).
router.post('/stripe/portal', protect, payments.billingPortal);

// Admin: is Stripe / Mux switched on (test or live)?
router.get('/config', protect, admin, payments.getConfig);

module.exports = router;
