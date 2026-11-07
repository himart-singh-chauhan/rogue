const express = require('express');
const router = express.Router();
const {
  purchaseTicket,
  verifyTicket,
  getTicketDetails,
  revokeTicket,
  grantFreeAccess,
  scanAndVerifyTicket,
  getAllTicketsAdmin,
  resetTicketScan
} = require('../controllers/ticketController');
const { protect, admin } = require('../middleware/authMiddleware');

// Logged-in users
router.get('/verify/:eventId', protect, verifyTicket);
router.get('/:ticketId', protect, getTicketDetails); // ownership checked in controller

// Issuing a paid ticket is admin-only until a payment gateway confirms payment.
router.post('/', protect, admin, purchaseTicket);

// Admin routes
router.put('/:ticketId/revoke', protect, admin, revokeTicket);
router.post('/grant', protect, admin, grantFreeAccess);
router.post('/scan', protect, admin, scanAndVerifyTicket);
router.get('/admin/list', protect, admin, getAllTicketsAdmin);
router.put('/:ticketId/reset', protect, admin, resetTicketScan);

module.exports = router;
