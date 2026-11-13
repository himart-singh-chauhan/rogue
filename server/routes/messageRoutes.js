const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { markMessageRead } = require('../controllers/adminExtrasController');
const member = require('../controllers/memberMessageController');

// Member inbox: notices from Admin → Communications and messages from other members
router.get('/', protect, member.inbox);
router.get('/sent', protect, member.sent);
router.get('/recipients', protect, member.searchRecipients);
router.post('/', protect, member.sendToMember);
router.put('/:id/read', protect, markMessageRead);

module.exports = router;
