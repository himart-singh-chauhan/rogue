const express = require('express');
const router = express.Router();
const { getProducts, getProductById, checkout } = require('../controllers/shopController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/:id', getProductById);
const { protect } = require('../middleware/authMiddleware');
const productAuth = require('../controllers/productAuthController');
router.get('/:id/authorization', protect, productAuth.getMyAuthorization);
router.post('/:id/authorization', protect, productAuth.requestAuthorization);
router.post('/checkout', optionalAuth, checkout);

module.exports = router;

