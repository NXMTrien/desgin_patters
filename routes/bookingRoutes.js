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

router.get('/:id', protect, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(req.params.id).populate('tour'); // populate nếu cần tour info

    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }

    // Nếu user là admin hoặc là chủ booking mới xem được
    if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền xem booking này' });
    }

    res.json({ booking });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


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