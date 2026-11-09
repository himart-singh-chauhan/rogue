const express = require('express');
const router = express.Router();
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');
const { listWeightClasses, createWeightClass, updateWeightClass, deleteWeightClass } = require('../controllers/weightClassController');

router.get('/', optionalAuth, listWeightClasses);
router.post('/', protect, admin, createWeightClass);
router.put('/:id', protect, admin, updateWeightClass);
router.delete('/:id', protect, admin, deleteWeightClass);

module.exports = router;
