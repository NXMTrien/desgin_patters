// controllers/bookingController.js
const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const User = require('../models/User');
const Payment = require('../models/Payment');
const paymentController = require('./vnpayController'); 
const { sendBookingConfirmationEmail,sendBookingCancellationEmail } = require('../utils/emailService');
const moment = require('moment');

exports.createBooking = async (req, res) => {
    try {
        const { tour: tourId, numberOfPeople, startDate, bankCode, language } = req.body;
        
        // 1. Kiểm tra Tour
        const tour = await Tour.findById(tourId);
        if (!tour) return res.status(404).json({ message: 'Tour không tồn tại' });

        // 2. Kiểm tra số chỗ trống (Giữ nguyên logic aggregate của bạn)
        const aggregateBookings = await Booking.aggregate([
            { 
                $match: { 
                    tour: tour._id, 
                    startDate: new Date(startDate),
                    status: { $ne: 'cancelled' }
                } 
            },
            { 
                $group: { 
                    _id: "$tour", 
                    totalBooked: { $sum: "$numberOfPeople" } 
                } 
            }
        ]);

        const currentBooked = aggregateBookings.length > 0 ? aggregateBookings[0].totalBooked : 0;
        const availableSlots = tour.maxGroupSize - currentBooked;

        if (numberOfPeople > availableSlots) {
            return res.status(400).json({ 
                status: 'fail', 
                message: availableSlots <= 0 ? `Xin lỗi, tour vào ngày này đã hết chỗ.` : `Xin lỗi, ngày này chỉ còn lại ${availableSlots} chỗ trống.` 
            });
        }

        // 3. Kiểm tra ngày khởi hành (Cách ít nhất 5 ngày)
        const startMoment = moment(startDate);
        const minStartDate = moment().add(5, 'days').startOf('day'); 
        if (startMoment.isBefore(minStartDate)) {
            return res.status(400).json({ 
                status: 'fail', 
                message: `Vui lòng chọn ngày khởi hành từ ${minStartDate.format('DD/MM/YYYY')}.` 
            });
        }
        
        const endDate = moment(startDate).add(tour.duration - 1, 'days').toDate(); 
        const totalPrice = Math.round(tour.price * numberOfPeople);
        
        // 4. TẠO BOOKING TRƯỚC
        const newBooking = await Booking.create({
            tour: tourId,
            user: req.user.id,
            numberOfPeople,
            startDate,
            endDate,
            totalPrice, 
            status: 'pending_payment'
        });

        // 5. TẠO PAYMENT PENDING
        const payment = await Payment.create({
            booking: newBooking._id,
            method: 'VNPAY',
            status: 'pending',
            amount: totalPrice
        });

        // 6. TẠO VNPAY URL (Nếu có bankCode)
        let vnpUrl = null;
        if (bankCode) {
            try {
                const vnpayReqData = {
                    bookingId: newBooking._id.toString(),
                    amount: totalPrice,
                    req: { headers: req.headers, socket: req.socket },
                    bankCode: bankCode,
                    language: language || 'vn'
                };
                vnpUrl = await paymentController.createVnpayUrlLogic(vnpayReqData);
            } catch (vnpayError) {
                console.error("Lỗi tạo VNPAY URL:", vnpayError.message);
                // Không xóa booking ở đây, để user có thể thanh toán lại sau trong trang My Bookings
            }
        }

        // 7. GỬI EMAIL XÁC NHẬN (ĐƯA RA NGOÀI ĐỂ LUÔN CHẠY)
        // Lấy đầy đủ thông tin để email hiển thị đẹp
        const bookingWithDetails = await Booking.findById(newBooking._id)
            .populate('user', 'email username')
            .populate('tour', 'title');

        try {
            await sendBookingConfirmationEmail(
                bookingWithDetails.user.email, 
                bookingWithDetails, 
                bookingWithDetails.tour.title, 
                vnpUrl // Nếu không có bankCode, vnpUrl sẽ là null
            );
            console.log(`✅ Email xác nhận đã gửi tới: ${bookingWithDetails.user.email}`);
        } catch (emailErr) {
            console.error("🚨 Lỗi gửi email (Nhưng vẫn giữ Booking):", emailErr.message);
        }

        // 8. PHẢN HỒI CHO FRONTEND
        res.status(201).json({
            status: 'success',
            message: vnpUrl ? 'Chuyển sang thanh toán VNPAY.' : 'Đặt tour thành công, vui lòng kiểm tra email.',
            bookingId: newBooking._id,
            vnpUrl: vnpUrl
        });

    } catch (error) {
        console.error("Lỗi hệ thống createBooking:", error.message);
        res.status(500).json({ status: 'fail', message: "Có lỗi xảy ra, vui lòng thử lại sau." });
    }
};
// Xem các Booking của cá nhân (Giữ nguyên)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
 .populate("tour","title")
      .populate("customTour")
      .populate("user", "username email phone");
    res.status(200).json({ status: 'success', results: bookings.length, data: { bookings } });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

// Hủy Booking
exports.cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        
        // 1. Tìm booking và kiểm tra quyền sở hữu (hoặc là Admin)
        const booking = await Booking.findById(bookingId)
            .populate('user', 'email username')
            .populate('tour', 'title');

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy đơn đặt tour.' });
        }

        // Kiểm tra nếu không phải chủ nhân của booking hoặc không phải admin
        if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bạn không có quyền hủy đơn này.' });
        }

        // 2. Kiểm tra trạng thái (Chỉ cho phép hủy nếu chưa hoàn thành hoặc chưa bị hủy)
        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Đơn này đã được hủy trước đó.' });
        }

        // 3. Cập nhật trạng thái
        booking.status = 'cancelled';
        await booking.save();

        // 4. Gửi email thông báo hủy
        try {
            // Bạn cần thêm hàm này vào emailService.js (hướng dẫn ở bước dưới)
            await sendBookingCancellationEmail(
                booking.user.email,
                booking,
                booking.tour.title
            );
            console.log(`✅ Email thông báo hủy đã gửi tới: ${booking.user.email}`);
        } catch (emailErr) {
            console.error("🚨 Lỗi gửi email hủy:", emailErr.message);
        }

        res.status(200).json({
            status: 'success',
            message: 'Hủy đơn đặt tour thành công.'
        });

    } catch (error) {
        console.error("Lỗi khi hủy booking:", error.message);
        res.status(500).json({ status: 'fail', message: error.message });
    }
};
// ADMIN: Xem tất cả bookings (Giữ nguyên)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('tour').populate('customTour') .populate('user', 'username email');
    res.status(200).json({ status: 'success', results: bookings.length, data: { bookings } });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
};

