// controllers/bookingController.js
const Booking = require('../models/Booking');
const Tour = require('../models/Tour');

// Đặt Tour
exports.createBooking = async (req, res) => {
  try {
    const { tour: tourId, numberOfPeople, startDate } = req.body;
    
    // 1. Lấy thông tin Tour
    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ message: 'Tour không tồn tại' });

    // 2. Tính tổng tiền
    const totalPrice = tour.price * numberOfPeople;
    
    // 3. Tạo Booking
    const newBooking = await Booking.create({
      tour: tourId,
      user: req.user.id, // ID người dùng từ middleware
      numberOfPeople,
      startDate,
      totalPrice,
      status: 'pending' // Chờ thanh toán/xác nhận
    });

    res.status(201).json({ 
      status: 'success', 
      message: 'Đặt tour thành công, chờ xác nhận/thanh toán.',
      data: { booking: newBooking } 
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// Xem các Booking của cá nhân
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
 .populate('tour') 
.populate('customTour');
    res.status(200).json({ status: 'success', results: bookings.length, data: { bookings } });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

// ADMIN: Xem tất cả bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('tour').populate('customTour') .populate('user', 'username email');
    res.status(200).json({ status: 'success', results: bookings.length, data: { bookings } });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
};