
// routes/tourRoutes.js
const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourControllers');
const categoryRoutes = require('./categoryRoutes');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/permissionMiddleware');
const imageUpload = require('../middleware/imageUpload');

// Public: Người dùng thường có thể xem
router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTour);

// Admin Only: Yêu cầu Đăng nhập và phải là 'admin'
router.use(protect, restrictTo(['admin']));
router.use('/categories', categoryRoutes);

router.post(
    '/', 
    imageUpload.uploadTourImages, 
    imageUpload.resizeTourImages,  
    tourController.createTour
);
router.patch(
    '/:id', 
    imageUpload.uploadTourImages,  
    imageUpload.resizeTourImages,  
    tourController.updateTour
);
router.delete('/:id', tourController.deleteTour);

module.exports = router;
