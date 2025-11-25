// config/vnpayConfig.js

// Lấy các biến môi trường
require('dotenv').config();

const vnpayConfig = {
    // Địa chỉ cổng thanh toán VNPAY
    vnpay_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    // URL dùng để kiểm tra kết quả thanh toán
    vnpay_Api: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction', 
    
    vnp_TmnCode: process.env.VNP_TMNCODE, 
    
    vnp_HashSecret: process.env.VNP_HASHSECRET,
    
    vnp_ReturnUrl: process.env.VNP_RETURNURL, 
    
    vnp_Version: '2.1.0',
    
    vnp_Locale: 'vn',
    
    vnp_CurrCode: 'VND',
    
    vnp_BankCode: 'NCB', 
};

module.exports = vnpayConfig;