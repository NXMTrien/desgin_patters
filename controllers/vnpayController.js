// controllers/paymentController.js
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const QRCode = require('qrcode');
const crypto = require('crypto');
const qs = require('qs');
const vnpayConfig = require('../config/vnpayConfig');
const { sendPaymentConfirmationEmail } = require('../utils/emailService');

// Thông tin tài khoản ngân hàng cố định cho chuyển khoản thủ công
const MANUAL_TRANSFER_INFO = {
    bankName: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
    accountName: "TRAN HUU GIAP", // Thay bằng tên tài khoản của bạn
    accountNumber: "1029224817", // Thay bằng số tài khoản của bạn
    noteTemplate: "THANH TOAN BOOKING [BOOKING_ID]" // Mẫu nội dung chuyển khoản
};

// Logic tạo URL VNPAY (GIỮ NGUYÊN để phát triển sau)
exports.createVnpayUrlLogic = async ({ bookingId, amount, req, bankCode, language }) => {
    // ... (Toàn bộ logic tạo URL VNPAY và hash GIỮ NGUYÊN) ...
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const createDate = new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14);

    const vnp_Params = {
        vnp_Version: vnpayConfig.vnp_Version,
        vnp_Command: 'pay',
        vnp_TmnCode: vnpayConfig.vnp_TmnCode,
        vnp_Amount: amount * 100,
        vnp_CurrCode: vnpayConfig.vnp_CurrCode,
        vnp_TxnRef: bookingId,
        vnp_OrderInfo: `Thanh toán Booking ${bookingId}`,
        vnp_OrderType: 'billpayment',
        vnp_Locale: language || vnpayConfig.vnp_Locale,
        vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate
    };

    if (bankCode) vnp_Params.vnp_BankCode = bankCode;

    // Sắp xếp tham số theo key
    const sortedParams = {};
    Object.keys(vnp_Params).sort().forEach(key => {
        sortedParams[key] = vnp_Params[key];
    });

    // Tạo chuỗi hash
    const signData = qs.stringify(sortedParams, { encode: false });
    const vnp_SecureHash = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret)
                            .update(Buffer.from(signData, 'utf-8'))
                            .digest('hex');

    // Thêm secure hash vào param
    sortedParams.vnp_SecureHash = vnp_SecureHash;

    // Tạo URL hoàn chỉnh
    return `${vnpayConfig.vnpay_Url}?${qs.stringify(sortedParams, { encode: false })}`;
};

// =============================
// TẠO THANH TOÁN CHUYỂN KHOẢN THỦ CÔNG
// =============================
exports.createBankPayment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!bookingId) return res.status(400).json({ message: "BookingId is required." });

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: "Không tìm thấy Booking." });
        
        // 1. Tạo Payment với method là 'transfer' (chuyển khoản thủ công)
        const payment = new Payment({
            booking: booking._id,
            method: "transfer", // Thay 'VNPAY' thành 'transfer'
            status: "pending",
            amount: booking.totalPrice
        });
        await payment.save();

        // 2. Chuẩn bị thông tin chuyển khoản thủ công
        const transferNote = MANUAL_TRANSFER_INFO.noteTemplate.replace('[BOOKING_ID]', booking._id.toString().slice(-6));
        const transferInfo = {
            ...MANUAL_TRANSFER_INFO,
            amount: booking.totalPrice,
            paymentId: payment._id,
            transferNote: transferNote,
        };

        // 3. Tùy chọn: Tạo URL VNPAY và QR code cho trường hợp muốn dùng nó sau này
        // Bạn có thể bỏ đoạn này nếu không muốn tạo ngay, nhưng tôi giữ để bạn tái sử dụng
        const vnpUrl = await exports.createVnpayUrlLogic({
            bookingId: booking._id.toString(),
            amount: booking.totalPrice,
            req,
            bankCode: 'NCB', // test ngân hàng
        });
        const qrCodeUrl = await QRCode.toDataURL(vnpUrl);

        // 4. Trả về thông tin thanh toán thủ công (và QR/URL VNPAY nếu muốn)
        res.status(200).json({
            message: "Tạo yêu cầu thanh toán chuyển khoản thủ công thành công. Vui lòng chuyển tiền theo thông tin dưới đây.",
            paymentId: payment._id,
            amount: booking.totalPrice,
            transferInfo: transferInfo,
            // Giữ lại VNPAY URL và QR code cho mục đích phát triển sau này
            vnpay: {
                vnpUrl,
                qrCodeUrl
            }
        });
    } catch (err) {
        console.error("Error createBankPayment (Manual Transfer):", err);
        res.status(500).json({ message: "Lỗi server khi tạo thanh toán.", error: err.message });
    }
};

// =============================
// LẤY THÔNG TIN CHUYỂN KHOẢN (Tùy chọn route)
// =============================
exports.getTransferInfo = async (req, res) => {
    res.status(200).json({
        message: "Thông tin chuyển khoản ngân hàng thủ công",
        transferInfo: MANUAL_TRANSFER_INFO
    });
};


// =============================
// XÁC NHẬN THANH TOÁN (GIỮ NGUYÊN)
// =============================
// exports.confirmBankPayment = async (req, res) => {
//     try {
//         const { paymentId } = req.body;
//         if (!paymentId) return res.status(400).json({ message: "PaymentId is required." });

//         const payment = await Payment.findById(paymentId);
//         if (!payment) return res.status(404).json({ message: "Không tìm thấy Payment." });
        
//         // Logic xác nhận thủ công: Admin sẽ gọi API này sau khi xác nhận chuyển khoản ngân hàng
//         payment.status = "successful";
//         await payment.save();

//         const booking = await Booking.findById(payment.booking);
//         if (booking) {
//             booking.status = "paid";
//             await booking.save();
//         }

//         res.status(200).json({ message: "Thanh toán thành công!", payment });
//     } catch (err) {
//         console.error("Error confirmBankPayment:", err);
//         res.status(500).json({ message: "Lỗi server khi xác nhận thanh toán.", error: err.message });
//     }
// };
// VNPAY RETURN (Callback/IPN)
// =============================
exports.vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // Sắp xếp lại tham số
        vnp_Params = Object.keys(vnp_Params).sort().reduce((obj, key) => {
            obj[key] = vnp_Params[key];
            return obj;
        }, {});

        // 1. Kiểm tra Secure Hash (Bắt buộc)
        const signData = qs.stringify(vnp_Params, { encode: false });
        const expectedHash = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret)
                                   .update(Buffer.from(signData, 'utf-8'))
                                   .digest('hex');

        if (secureHash !== expectedHash) {
            console.warn("VNPAY Return: Invalid Secure Hash");
            return res.render('vnpay_return', { code: '97', message: 'Sai chữ ký số (Secure Hash)' });
        }

        // Dữ liệu giao dịch
        const bookingId = vnp_Params['vnp_TxnRef']; // Dùng bookingId làm vnp_TxnRef
        const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
        const vnp_TransactionStatus = vnp_Params['vnp_TransactionStatus'];
        const amount = vnp_Params['vnp_Amount'] / 100;
        const vnpayTxnId = vnp_Params['vnp_TransactionNo'];

        // 2. Tìm Booking và Payment
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.render('vnpay_return', { code: '01', message: 'Booking không tồn tại' });
        }

        // Tìm Payment có bookingId và status='pending'
        let payment = await Payment.findOne({
            booking: booking._id,
            method: 'VNPAY', // Giả sử bạn tạo Payment với method VNPAY khi redirect
            status: 'pending'
        });

        if (!payment) {
            // Trường hợp không tìm thấy payment pending, kiểm tra xem đã thanh toán chưa
            if (booking.status === 'paid') {
                 // Giao dịch đã được xử lý trước đó
                return res.render('vnpay_return', { code: '00', message: 'Giao dịch đã được xử lý trước đó' });
            }
            // Nếu không phải đã thanh toán, thì lỗi
            return res.render('vnpay_return', { code: '02', message: 'Payment không tồn tại hoặc đã bị hủy' });
        }

        // 3. Xử lý kết quả VNPAY
        if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
            // Cập nhật trạng thái thành công
            payment.status = 'successful';
            // Bạn có thể lưu thêm mã giao dịch VNPAY nếu cần
            // payment.vnpayTxnId = vnpayTxnId; 
            await payment.save();

            booking.status = 'paid';
            await booking.save();
            
            // Trả về kết quả thành công cho người dùng
            res.render('vnpay_return', { code: '00', message: 'Thanh toán VNPAY thành công' });

        } else {
            // Thanh toán thất bại hoặc pending
            payment.status = 'failed'; 
            await payment.save();
            
            // Trả về kết quả thất bại
            res.render('vnpay_return', { code: '99', message: 'Thanh toán thất bại', vnp_ResponseCode });
        }

    } catch (error) {
        console.error("VNPAY Return Error:", error);
        res.render('vnpay_return', { code: '99', message: 'Lỗi không xác định' });
    }
};
// XÁC NHẬN THANH TOÁN TIỀN MẶT
// =============================
exports.confirmCashPayment = async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!paymentId) return res.status(400).json({ message: "PaymentId is required." });

        const payment = await Payment.findById(paymentId);
        if (!payment) return res.status(404).json({ message: "Không tìm thấy Payment." });

        // Đảm bảo chỉ xác nhận các giao dịch tiền mặt pending
        if (payment.method !== 'cash' || payment.status !== 'pending') {
             return res.status(400).json({ message: "Giao dịch không hợp lệ hoặc đã được xử lý." });
        }
        
        // Cập nhật Payment
        payment.status = "successful";
        await payment.save();

        // Cập nhật Booking
        const booking = await Booking.findById(payment.booking);
        if (booking) {
            booking.status = "paid";
            await booking.save();
        }

        res.status(200).json({ message: "Thanh toán tiền mặt thành công!", payment });
    } catch (err) {
        console.error("Error confirmCashPayment:", err);
        res.status(500).json({ message: "Lỗi server khi xác nhận thanh toán tiền mặt.", error: err.message });
    }
};
// =============================
// THÔNG BÁO ĐÃ CHUYỂN KHOẢN (KHÁCH HÀNG GỌI)
// =============================
exports.notifyTransfer = async (req, res) => {
    try {
        const { paymentId } = req.body;
        console.log("1. Received paymentId:", paymentId);
        if (!paymentId) return res.status(400).json({ message: "PaymentId is required." });

        const payment = await Payment.findById(paymentId);
        if (!payment) return res.status(404).json({ message: "Không tìm thấy Payment." });
        console.log("2. Found payment. Current status:", payment.status);

        // 1. Kiểm tra trạng thái hiện tại (chỉ cập nhật nếu đang là pending)
        if (payment.status !== 'pending' && payment.status !== 'awaiting_confirmation') {
            return res.status(400).json({ message: "Giao dịch đã được xử lý hoặc đang chờ xác nhận." });
        }
        
        // 2. Cập nhật Payment status thành 'awaiting_confirmation'
        payment.status = "awaiting_confirmation";
        await payment.save();
        console.log("3. Payment status updated. Searching for Booking...");

        // 3. Cập nhật Booking status thành 'awaiting_confirmation'
        const booking = await Booking.findById(payment.booking);
        if (booking) {
            booking.status = "awaiting_confirmation"; // 🚨 Cần đảm bảo Booking Model hỗ trợ trạng thái này
            await booking.save();
            console.log("4. Booking status updated.");
        }

        // 4. Gửi thông báo/email cho Admin (Thực hiện ở đây)
        // Ví dụ: sendNotificationToAdmin(`Cần xác nhận chuyển khoản cho Booking ID: ${booking._id}`);

        res.status(200).json({ message: "Thông báo chuyển khoản đã được ghi nhận. Vui lòng chờ Admin xác nhận.", payment });
    } catch (err) {
        console.error("Error notifyTransfer:", err);
        res.status(500).json({ message: "Lỗi server khi gửi thông báo chuyển khoản.", error: err.message });
    }
}; 
// =============================
// XÁC NHẬN THANH TOÁN (CHỈ DÀNH CHO ADMIN)
// =============================
exports.confirmBankPayment = async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!paymentId) return res.status(400).json({ message: "PaymentId is required." });

        const payment = await Payment.findById(paymentId);
        if (!payment) return res.status(404).json({ message: "Không tìm thấy Payment." });
        
        // 🚨 CHỈ CHO PHÉP XÁC NHẬN KHI ĐANG Ở TRẠNG THÁI CHỜ XÁC NHẬN
        if (payment.status !== 'awaiting_confirmation') {
             return res.status(400).json({ message: "Giao dịch không hợp lệ hoặc đã được xử lý." });
        }
        
        // Logic xác nhận thủ công: Admin đã kiểm tra sao kê ngân hàng
      // 1. Cập nhật trạng thái thành công
        payment.status = "successful";
        await payment.save();

        const booking = await Booking.findById(payment.booking).populate('user').populate('tour'); 
        if (booking) {
            booking.status = "paid";
            await booking.save();
        }
        
        // 2. GỬI THÔNG BÁO XÁC NHẬN THANH TOÁN QUA EMAIL CHO NGƯỜI DÙNG
      if (booking && booking.user) {
        try {
            await sendPaymentConfirmationEmail(
                booking.user.email,
                booking,
                booking.tour.title 
            );
        } catch (emailError) {
            console.error("LỖI GỬI EMAIL XÁC NHẬN THANH TOÁN (Admin Confirm):", emailError);
        }
    }

    res.status(200).json({ message: "Thanh toán thành công và Email đã được gửi!", payment });
   } catch (err) {
        console.error("Error confirmBankPayment:", err);
        res.status(500).json({ message: "Lỗi server khi xác nhận thanh toán.", error: err.message });
    }
};
exports.getAwaitingPayments = async (req, res) => {
    try {
        // Tìm kiếm các Payment có trạng thái là 'awaiting_confirmation'
        // và phương thức là 'transfer' (chuyển khoản thủ công)
        const payments = await Payment.find({
            status: 'awaiting_confirmation',
            method: 'transfer' 
        })
        .sort({ createdAt: 1 }) // Sắp xếp để xem giao dịch mới nhất trước
        // .populate('booking') // Tùy chọn: Nếu bạn muốn hiển thị thông tin Booking liên quan

        res.status(200).json({
            status: 'success',
            results: payments.length,
            data: {
                payments 
            }
        });
    } catch (err) {
        console.error("Error fetching awaiting payments:", err);
        // Trả về lỗi 500 chi tiết hơn cho Frontend
        res.status(500).json({ 
            status: 'error',
            message: "Lỗi server khi tải danh sách chờ xác nhận.", 
            error: err.message 
        });
    }
};
