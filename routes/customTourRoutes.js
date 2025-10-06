// routes/customTourRoutes.js
const express = require('express');
const router = express.Router();
const customTourController = require('../controllers/customTourController');

// Không yêu cầu đăng nhập để tạo đề xuất tour
router.post('/', customTourController.createCustomTour);

// Route để xem tour được xây dựng sẵn (sử dụng Director)
router.get('/predefined', customTourController.getPredefinedTour);

module.exports = router;