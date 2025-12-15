// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/vnpayController'); 
const { protect } = require('../middleware/authMiddleware');
const { checkAdmin } = require('../controllers/authControllers');

// Tất cả các route đều yêu cầu đăng nhập
router.use(protect);

/// ====== BANK PAYMENT (CHUYỂN KHOẢN THỦ CÔNG) ======
// Tạo yêu cầu thanh toán chuyển khoản thủ công
router.post('/bank', paymentController.createBankPayment);

// Lấy thông tin chuyển khoản (tùy chọn)
router.get('/bank/info', paymentController.getTransferInfo);
router.post('/bank/notify', paymentController.notifyTransfer);

// Xác nhận thanh toán thủ công (thường dùng cho Admin)
router.post('/bank/confirm',protect,checkAdmin, paymentController.confirmBankPayment);
router.get(
    '/admin/awaiting', protect,checkAdmin, paymentController.getAwaitingPayments 
);

// Phải trùng với VNP_RETURNURL trong config
router.get('/vnpay_return', paymentController.vnpayReturn);

// Xác nhận thanh toán tiền mặt (Thường chỉ dùng cho Admin/Nhân viên)
router.post('/cash/confirm', protect, paymentController.confirmCashPayment);

// ====== VNPAY PAYMENT ======
// Giữ nguyên hoặc có thể thêm các route VNPAY sau này
// router.post('/vnpay', paymentController.createVnpayPayment);
// router.get('/vnpay_return', paymentController.vnpayReturn);

module.exports = router;
