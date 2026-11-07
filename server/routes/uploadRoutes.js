const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { signUpload, getUploadLimits } = require('../controllers/uploadController');

router.get('/limits', getUploadLimits);
router.post('/sign', protect, signUpload);

module.exports = router;
