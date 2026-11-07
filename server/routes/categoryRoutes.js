const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories
} = require('../controllers/categoryController');

router.get('/', getAllCategories);
router.get('/seed', protect, admin, seedDefaultCategories);
router.post('/seed', protect, admin, seedDefaultCategories);
router.get('/:id', getCategoryById);
router.post('/', protect, admin, createCategory);
router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;
