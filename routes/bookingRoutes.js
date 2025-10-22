// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingControllers');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/permissionMiddleware');

// Tất cả các route Booking đều yêu cầu đăng nhập
router.use(protect);

// Người dùng thường
router.post('/', protect, bookingController.createBooking);

router.get('/my-bookings', protect, bookingController.getMyBookings);

router.get('/all', protect, bookingController.getAllBookings);
// Admin Only
router.get('/', restrictTo(['admin']), bookingController.getAllBookings);


router.put('/:id', protect, async (req, res) => {
  try {
    const booking = await require('../models/Booking').findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ message: 'Cập nhật trạng thái thành công', booking });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;