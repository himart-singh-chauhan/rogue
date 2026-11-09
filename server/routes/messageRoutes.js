const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyMessages, markMessageRead } = require('../controllers/adminExtrasController');

// Member inbox (messages sent from Admin → Communications)
router.get('/', protect, getMyMessages);
router.put('/:id/read', protect, markMessageRead);

module.exports = router;
