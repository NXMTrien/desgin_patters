// routes/tourRoutes.js
const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourControllers');
const categoryRoutes = require('./categoryRoutes');
const { protect } = require('../middleware/auhtMiddleware');
const { restrictTo } = require('../middleware/permissionMiddleware');

// Public: Người dùng thường có thể xem
router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTour);

// Admin Only: Yêu cầu Đăng nhập và phải là 'admin'
router.use(protect, restrictTo(['admin']));
router.use('/categories', categoryRoutes);

router.post('/', tourController.createTour);
router.patch('/:id', tourController.updateTour);
router.delete('/:id', tourController.deleteTour);

module.exports = router;