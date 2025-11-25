// controllers/paymentController.js
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const QRCode = require('qrcode');

// ========================= BANK PAYMENT =========================
// Tạo thanh toán chuyển khoản với QR code thực
exports.createBankPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    console.log('BookingId received:', bookingId);

    if (!bookingId) {
      return res.status(400).json({ message: 'BookingId is required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy Booking.' });
    }

    // Tạo Payment mới
    const payment = new Payment({
      booking: booking._id,
      method: 'bank',   // ✅ method phải hợp lệ enum ['bank', 'vnpay']
      status: 'pending',
      amount: booking.totalPrice,
    });

    await payment.save();

    const bankCode = '970407'; // Techcombank VietQR code
    const accountNumber = '123456789';
    const accountName = encodeURIComponent('Công ty Tourify');
    const amount = booking.totalPrice;
    const note = encodeURIComponent(`ThanhToanBooking${booking._id}`);

    const qrCodeUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-qr_only.png?amount=${amount}&addInfo=${note}`;

    
   

    res.status(200).json({
      paymentId: payment._id,
      qrCodeUrl,
    });
  } catch (err) {
    console.error('Error createBankPayment:', err);
    res.status(500).json({ message: 'Lỗi server khi tạo thanh toán.', error: err.message });
  }
};

// Xác nhận thanh toán chuyển khoản
exports.confirmBankPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: 'PaymentId is required.' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy Payment.' });
    }

    // Cập nhật trạng thái thanh toán
    payment.status = 'successful';
    await payment.save();

    // Cập nhật Booking sang paid
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.status = 'paid';
      await booking.save();
    }

    res.status(200).json({ message: 'Thanh toán thành công!', payment });
  } catch (err) {
    console.error('Error confirmBankPayment:', err);
    res.status(500).json({ message: 'Lỗi server khi xác nhận thanh toán.', error: err.message });
  }
};
