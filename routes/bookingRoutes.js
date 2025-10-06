// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingControllers');
const { protect } = require('../middleware/auhtMiddleware');
const { restrictTo } = require('../middleware/permissionMiddleware');

// Tất cả các route Booking đều yêu cầu đăng nhập
router.use(protect);

// Người dùng thường
router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getMyBookings);

// Admin Only
router.get('/', restrictTo(['admin']), bookingController.getAllBookings);

module.exports = router;