// controllers/bookingController.js
const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const User = require('../models/User');
const Payment = require('../models/Payment');
const vnpayController = require('./vnpayController');
const { sendBookingConfirmationEmail } = require('../utils/emailService');
const moment = require('moment');

// Đặt Tour
exports.createBooking = async (req, res) => {
    try {
        // Lấy method thanh toán từ body, mặc định là 'VNPAY' nếu có bankCode
        const { tour: tourId, numberOfPeople, startDate, bankCode, language, paymentMethod = 'VNPAY' } = req.body;
        
        // 1. Lấy thông tin Tour và kiểm tra validation (ngày, số lượng)
        const tour = await Tour.findById(tourId);
        if (!tour) return res.status(404).json({ message: 'Tour không tồn tại' });

        // --- Kiểm tra Ngày Khởi Hành Tối Thiểu (5 ngày) ---
        const startMoment = moment(startDate);
        const minStartDate = moment().add(5, 'days').startOf('day'); 

        if (startMoment.isBefore(minStartDate)) {
            const minDateDisplay = minStartDate.format('DD/MM/YYYY');
            return res.status(400).json({ 
                status: 'fail', 
                message: `Ngày khởi hành phải cách ngày hiện tại ít nhất 5 ngày. Vui lòng chọn ngày từ ${minDateDisplay} trở đi.` 
            });
        }
        
        // Tính Ngày Kết Thúc
        if (!tour.duration || tour.duration < 1) {
            return res.status(500).json({ status: 'fail', message: 'Thông tin Tour bị thiếu duration.' });
        }
        const endDate = moment(startDate).add(tour.duration - 1, 'days').toDate(); 
        
        // Kiểm tra Giới Hạn Nhóm
        const maxGroupSize = tour.maxGroupSize;
        if (numberOfPeople > maxGroupSize) {
            return res.status(400).json({ 
                status: 'fail', 
                message: `Số lượng người đặt (${numberOfPeople}) đã vượt quá giới hạn của Tour này. Tour chỉ được tối đa ${maxGroupSize} người.` 
            });
        }

        // 2. Tính tổng tiền
        const totalPrice = Math.round(tour.price * numberOfPeople);
        
        // 3. TẠO BOOKING (Trạng thái chờ thanh toán)
        const newBooking = await Booking.create({
            tour: tourId,
            user: req.user.id,
            numberOfPeople,
            startDate,
            endDate,
            totalPrice, 
            status: 'pending_payment' // Trạng thái chờ thanh toán
        });

        // 4. TẠO PAYMENT PENDING CHO GIAO DỊCH VNPAY
        const payment = await Payment.create({
            booking: newBooking._id,
            method: 'VNPAY', // Giả định VNPAY là phương thức mặc định nếu có bankCode
            status: 'pending', // Trạng thái chờ cổng thanh toán xác nhận
            amount: totalPrice
        });
        
        // 5. Chuẩn bị tạo VNPAY URL
        let vnpUrl = null;
        try {
            // Chỉ gọi VNPAY khi có yêu cầu chuyển khoản VNPAY (bankCode được cung cấp từ Frontend)
            if (bankCode) { 
                 const vnpayReqData = {
                    bookingId: newBooking._id.toString(),
                    amount: totalPrice,
                    req: { headers: req.headers, socket: req.socket }, // Truyền thông tin req cần thiết cho IP
                    bankCode: bankCode,
                    language: language || 'vn'
                };
                
                // Sử dụng hàm logic VNPAY từ paymentController
                vnpUrl = await paymentController.createVnpayUrlLogic(vnpayReqData);

                if (!vnpUrl) throw new Error("VNPAY URL generation failed.");
                
                // 🚨 GỬI EMAIL THÔNG BÁO (NÊN LÀM SAU KHI CÓ VNPAY URL)
                const bookingWithDetails = await Booking.findById(newBooking._id)
                    .populate({ path: 'user', select: 'email' })
                    .populate({ path: 'tour', select: 'title' }); 
                    
                await sendBookingConfirmationEmail(
                    bookingWithDetails.user.email, 
                    bookingWithDetails, 
                    bookingWithDetails.tour.title, 
                    vnpUrl
                );
                console.log(`✅ Email xác nhận Booking và nhắc nhở thanh toán VNPAY đã gửi.`);

                // 6. Trả về VNPAY URL để Frontend Redirect
                return res.status(201).json({
                    status: 'success',
                    message: 'Booking đã tạo, chuyển sang thanh toán VNPAY.',
                    bookingId: newBooking._id,
                    paymentId: payment._id, // Trả về paymentId
                    vnpUrl: vnpUrl // URL thanh toán VNPAY
                });

            } else {
                // 7. Nếu không có bankCode (người dùng chưa chọn phương thức), trả về Booking/Payment ID
                return res.status(201).json({
                    status: 'success',
                    message: 'Booking đã tạo, vui lòng chọn phương thức thanh toán.',
                    bookingId: newBooking._id,
                    paymentId: payment._id, // Trả về paymentId
                    vnpUrl: null // Không có redirect ngay lập tức
                });
            }
            
        } catch (vnpayError) {
            // 🚨 Xử lý lỗi VNPAY: Xóa cả Booking và Payment vừa tạo
            console.error("Lỗi khi tạo VNPAY URL (Sẽ xóa Booking và Payment):", vnpayError.message);
            await Booking.findByIdAndDelete(newBooking._id);
            await Payment.findByIdAndDelete(payment._id);
            
            return res.status(500).json({ 
                status: 'fail', 
                message: 'Đặt tour thành công, nhưng không thể tạo liên kết thanh toán VNPAY. Vui lòng thử lại.' 
            });
        }

    } catch (error) {
        console.error("Lỗi đặt Tour:", error.message, error.stack);
        res.status(400).json({ status: 'fail', message: error.message });
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

// ADMIN: Xem tất cả bookings (Giữ nguyên)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('tour').populate('customTour') .populate('user', 'username email');
    res.status(200).json({ status: 'success', results: bookings.length, data: { bookings } });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
};