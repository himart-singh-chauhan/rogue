const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventPaid
} = require('../controllers/eventController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

// Public routes (optionalAuth lets admins / ticket holders see stream URLs of paid events)
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);

// Admin routes
router.post('/', protect, admin, createEvent);
router.put('/:id', protect, admin, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);
router.put('/:id/toggle-paid', protect, admin, toggleEventPaid);

module.exports = router;
