// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/vnpayController'); 
const { protect } = require('../middleware/authMiddleware');

// Tất cả các route đều yêu cầu đăng nhập
router.use(protect);

// ====== BANK PAYMENT ======
// Tạo thanh toán chuyển khoản và QR code
router.post('/bank', paymentController.createBankPayment);

// Xác nhận thanh toán chuyển khoản
router.post('/bank/confirm', paymentController.confirmBankPayment);

// ====== VNPAY PAYMENT ======
// Sau này có thể thêm:
// router.post('/vnpay', paymentController.createVnpayPayment);
// router.get('/vnpay_return', paymentController.vnpayReturn);

module.exports = router;
