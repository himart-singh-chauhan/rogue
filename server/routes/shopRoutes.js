const express = require('express');
const router = express.Router();
const { getProducts, getProductById, checkout } = require('../controllers/shopController');

router.get('/', getProducts);
router.get('/:id', getProductById);
const { protect } = require('../middleware/authMiddleware');
const productAuth = require('../controllers/productAuthController');
router.get('/:id/authorization', protect, productAuth.getMyAuthorization);
router.post('/:id/authorization', protect, productAuth.requestAuthorization);
router.post('/checkout', protect, checkout); // an account is needed to buy anything

module.exports = router;

