const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventPaid,
  getMuxStream,
  createMuxStream,
  resetMuxKey,
  deleteMuxStream,
  getPlayback
} = require('../controllers/eventController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');

// Public routes (optionalAuth lets admins / ticket holders see stream URLs of paid events)
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);

// The player asks for playback here: free events for everyone, paid events for admins and ticket holders.
router.get('/:id/playback', optionalAuth, getPlayback);
// Live controls and chat
const live = require('../controllers/eventLiveController');
router.post('/:id/live', protect, admin, live.setLive);
router.put('/:id/stream-settings', protect, admin, live.updateStreamSettings);
router.get('/:id/chat', optionalAuth, live.listChat);
router.post('/:id/chat', protect, live.postChat);
router.delete('/:id/chat/:messageId', protect, admin, live.deleteChat);

// Admin routes
router.post('/', protect, admin, createEvent);
router.put('/:id', protect, admin, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);
router.put('/:id/toggle-paid', protect, admin, toggleEventPaid);

// Mux live stream for the event (stream key for OBS etc.)
router.get('/:id/mux', protect, admin, getMuxStream);
router.post('/:id/mux', protect, admin, createMuxStream);
router.post('/:id/mux/reset-key', protect, admin, resetMuxKey);
router.delete('/:id/mux', protect, admin, deleteMuxStream);

module.exports = router;
