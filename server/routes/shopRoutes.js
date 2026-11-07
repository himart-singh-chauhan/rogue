const express = require('express');
const router = express.Router();
const { getProducts, getProductById, checkout } = require('../controllers/shopController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/checkout', optionalAuth, checkout);

module.exports = router;

