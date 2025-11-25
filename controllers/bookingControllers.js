// controllers/bookingController.js
const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
// 💡 LƯU Ý: Đảm bảo vnpayController.js đã được cập nhật
// để export hàm 'createVnpayUrlLogic'
const vnpayController = require('./vnpayController');

// Đặt Tour
exports.createBooking = async (req, res) => {
    try {
        const { tour: tourId, numberOfPeople, startDate, bankCode, language } = req.body;
        
        // 1. Lấy thông tin Tour
        const tour = await Tour.findById(tourId);
        if (!tour) return res.status(404).json({ message: 'Tour không tồn tại' });

        // 2. Tính tổng tiền (Cần đảm bảo là số nguyên)
        const totalPrice = Math.round(tour.price * numberOfPeople);
        
        // 3. Tạo Booking (Trạng thái chờ thanh toán)
        const newBooking = await Booking.create({
            tour: tourId,
            user: req.user.id,
            numberOfPeople,
            startDate,
            totalPrice, // Đã được làm tròn
            status: 'pending_payment' 
        });

        // 4. Chuẩn bị Request cho VNPAY Controller
        const vnpayReq = {
            headers: req.headers, // Vẫn cần headers để lấy IP
            body: { 
                bookingId: newBooking._id.toString(), // Truyền ID của Booking vừa tạo
                bankCode: bankCode || '', 
                language: language || 'vn'
            },
            user: req.user // Vẫn truyền để giữ tính nhất quán
        };

        let vnpUrl = null;
        try {
            // 5. Gọi hàm logic VNPAY trực tiếp (không cần giả lập res)
            // Hàm này sẽ trả về URL hoặc ném ra lỗi (throw error)
            vnpUrl = await vnpayController.createVnpayUrlLogic(vnpayReq);

            if (!vnpUrl) {
                // Trường hợp hàm trả về null/undefined (Lỗi hiếm gặp)
                throw new Error("VNPAY URL generation failed silently.");
            }
            
            // 6. Trả về kết quả thành công (có VNPAY URL)
            return res.status(201).json({
                status: 'success',
                message: 'Booking đã tạo, chuyển sang thanh toán VNPAY.',
                bookingId: newBooking._id,
                vnpUrl: vnpUrl // URL thanh toán VNPAY
            });
            
        } catch (vnpayError) {
            // 🚨🚨🚨 7. Xử lý lỗi VNPAY: Xóa Booking vừa tạo 
            console.error("Lỗi khi tạo VNPAY URL (Sẽ xóa Booking):", vnpayError.message);
            await Booking.findByIdAndDelete(newBooking._id);
            
            // Trả về lỗi 500 với thông báo tùy chỉnh cho client
            return res.status(500).json({ 
                status: 'fail', 
                message: 'Đặt tour thành công, nhưng không thể tạo liên kết thanh toán VNPAY. Vui lòng thử lại.' 
            });
        }
        
    } catch (error) {
        // Lỗi này bắt các lỗi khác (lỗi DB, lỗi Tour không tồn tại, lỗi input)
        console.error("Lỗi đặt Tour:", error.message, error.stack);
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// Xem các Booking của cá nhân (Giữ nguyên)
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

// ADMIN: Xem tất cả bookings (Giữ nguyên)
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('tour').populate('customTour') .populate('user', 'username email');
    res.status(200).json({ status: 'success', results: bookings.length, data: { bookings } });
  } catch (error) {
    res.status(500).json({ status: 'fail', message: error.message });
  }
};