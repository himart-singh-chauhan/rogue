const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { listPublicPlans, listAllPlans, createPlan, updatePlan, deletePlan } = require('../controllers/planController');

router.get('/', listPublicPlans);
router.get('/all', protect, admin, listAllPlans);
router.post('/', protect, admin, createPlan);
router.put('/:id', protect, admin, updatePlan);
router.delete('/:id', protect, admin, deletePlan);

module.exports = router;
