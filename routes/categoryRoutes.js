// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryControllers'); 
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/permissionMiddleware');

// Chỉ Admin mới có quyền quản lý Category
router.use(protect, restrictTo(['admin']));

router.route('/')
  .post(categoryController.createCategory)
  .get(categoryController.getAllCategories);

router.route('/:id')
  .patch(categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

module.exports = router;