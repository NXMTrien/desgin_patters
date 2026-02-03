const nodemailer = require('nodemailer');

// 1. Khởi tạo transporter dùng chung
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT || 465, 
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
    },
});

// Kiểm tra kết nối
transporter.verify((error) => {
    if (error) console.error("❌ Lỗi cấu hình Email:", error);
    else console.log("🚀 Hệ thống Email đã sẵn sàng!");
});

/**
 * 2. HÀM GỬI MAIL TỔNG QUÁT (Core function)
 * Tất cả các hàm bên dưới sẽ gọi qua hàm này
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        const mailOptions = {
            from: `"Tourify_Magic xin chào" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Lỗi gửi email:', error);
        return false;
    }
};



const sendVerificationEmail = async (email, otp) => {
    return await sendEmail({
        to: email,
        subject: 'Mã Xác Thực Tài Khoản Tour Du Lịch của bạn',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;">
                <h2>Xác Thực Tài Khoản</h2>
                <p>Chào bạn, vui lòng sử dụng mã OTP sau để xác thực:</p>
                <h1 style="color: #007bff; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 5px;">${otp}</h1>
                <p>Mã này sẽ hết hạn sau 10 phút.</p>
            </div>
        `
    });
};

const sendPasswordResetEmail = async (email, otp) => {
    return await sendEmail({
        to: email,
        subject: 'Yêu Cầu Đặt Lại Mật Khẩu Tour Du Lịch',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ffcc00; max-width: 600px;">
                <h2 style="color: #ff9800;">🔔 Đặt Lại Mật Khẩu</h2>
                <p>Sử dụng mã OTP dưới đây để thay đổi mật khẩu:</p>
                <h1 style="text-align: center; background: #fff3cd; padding: 15px; border-radius: 8px;">${otp}</h1>
                <p>Mã này hết hạn sau 10 phút.</p>
            </div>
        `
    });
};

const sendBookingConfirmationEmail = async (email, bookingDetails, tourTitle, vnpUrl) => {
    const startDateFormatted = new Date(bookingDetails.startDate).toLocaleDateString('vi-VN');
    const totalPriceFormatted = bookingDetails.totalPrice.toLocaleString('vi-VN');
    const bookingNo = bookingDetails._id.toString().slice(-8).toUpperCase(); 

    return await sendEmail({
        to: email,
        subject: `Xác Nhận Đơn Đặt Tour #${bookingNo}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #007bff; max-width: 600px;">
                <h2 style="color: #007bff;">🎉 Xác Nhận Đặt Tour Thành Công</h2>
                <p><b>Tour:</b> ${tourTitle}</p>
                <p><b>Ngày khởi hành:</b> ${startDateFormatted}</p>
                <p><b>Tổng tiền:</b> ${totalPriceFormatted} VNĐ</p>
                <div style="margin-top: 20px;">
                    <a href="${vnpUrl}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">THANH TOÁN QUA VNPAY NGAY</a>
                </div>
            </div>
        `
    });
};

const sendPaymentConfirmationEmail = async (email, bookingDetails, tourTitle) => {
    const bookingNo = bookingDetails._id.toString().slice(-8).toUpperCase(); 
    return await sendEmail({
        to: email,
        subject: `✅ Xác Nhận Thanh Toán #${bookingNo}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #28a745; max-width: 600px;">
                <h2 style="color: #28a745;">THANH TOÁN THÀNH CÔNG</h2>
                <p>Cảm ơn bạn đã thanh toán cho tour <b>${tourTitle}</b>. Chúc bạn có một chuyến đi vui vẻ!</p>
            </div>
        `
    });
};

const sendBookingCancellationEmail = async (email, booking, tourTitle) => {
    return await sendEmail({
        to: email,
        subject: `[THÔNG BÁO] Hủy đặt tour: ${tourTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; border: 1px solid #eee; max-width: 600px;">
                <div style="background-color: #ef7470; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0;">Hủy Tour Thành Công</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Chào bạn, chúng tôi xác nhận tour <b>${tourTitle}</b> đã được hủy thành công trên hệ thống.</p>
                </div>
            </div>
        `
    });
};

module.exports = {
    sendEmail, // Bạn có thể gọi trực tiếp hàm này nếu muốn gửi mail tùy biến
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendBookingConfirmationEmail,
    sendPaymentConfirmationEmail,
    sendBookingCancellationEmail,
};