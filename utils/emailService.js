// utils/emailService.js
const nodemailer = require('nodemailer');

// 🚨 Lấy thông tin từ biến môi trường
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, 
    },
});

const sendVerificationEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Mã Xác Thực Tài Khoản Tour Du Lịch của bạn',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px;">
                    <h2>Xác Thực Tài Khoản</h2>
                    <p>Chào bạn,</p>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại dịch vụ Tour Du Lịch của chúng tôi.</p>
                    <p>Vui lòng sử dụng mã OTP sau để hoàn tất quá trình xác thực:</p>
                    <h1 style="color: #007bff; text-align: center; background: #f0f0f0; padding: 10px; border-radius: 5px;">${otp}</h1>
                    <p>Mã này sẽ hết hạn sau 10 phút.</p>
                    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                    <p>Trân trọng,<br>Đội ngũ Tour Du Lịch</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email đã gửi: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        return false;
    }
};
const sendPasswordResetEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            // 🚨 Thay đổi Chủ đề email để rõ ràng về mục đích
            subject: 'Yêu Cầu Đặt Lại Mật Khẩu Tour Du Lịch',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ffcc00; max-width: 600px; background-color: #fff8e1;">
                    <h2 style="color: #ff9800;">🔔 Đặt Lại Mật Khẩu Tài Khoản</h2>
                    <p>Chào bạn,</p>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    <p>Vui lòng sử dụng **MÃ XÁC NHẬN (OTP)** sau để hoàn tất quá trình:</p>
                    
                    <h1 style="color: #ff9800; text-align: center; background: #fff3cd; padding: 15px; border: 2px dashed #ffc107; border-radius: 8px; letter-spacing: 3px;">
                        ${otp}
                    </h1>
                    
                    <p>Mã này sẽ **hết hạn sau 10 phút**. Xin lưu ý, mã này chỉ có thể sử dụng một lần.</p>
                    
                    <hr style="border-top: 1px solid #ffcc00;">
                    
                    <p style="color: #777;">
                        Nếu bạn **không** yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                    </p>
                    <p>Trân trọng,<br>Đội ngũ Tour Du Lịch</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email đặt lại mật khẩu đã gửi: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('Lỗi khi gửi email đặt lại mật khẩu:', error);
        return false;
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
};