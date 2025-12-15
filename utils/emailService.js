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

const sendBookingConfirmationEmail = async (email, bookingDetails, tourTitle, vnpUrl) => {
    try {
        // Định dạng ngày tháng
        const startDateFormatted = new Date(bookingDetails.startDate).toLocaleDateString('vi-VN');
        const totalPriceFormatted = bookingDetails.totalPrice.toLocaleString('vi-VN');
        // Tạo mã booking ngắn gọn (ví dụ: 8 ký tự cuối của ID)
        const bookingNo = bookingDetails._id.toString().slice(-8).toUpperCase(); 

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `Xác Nhận Đơn Đặt Tour #${bookingNo} & Hướng Dẫn Thanh Toán`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #007bff; max-width: 600px; background-color: #e3f2fd;">
                    <h2 style="color: #007bff; text-align: center;">🎉 Xác Nhận Đặt Tour Thành Công</h2>
                    <p>Chào bạn,</p>
                    <p>Cảm ơn bạn đã đặt tour **${tourTitle}** với chúng tôi! Dưới đây là chi tiết đơn hàng của bạn.</p>
                    
                    <div style="background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #bbdefb; margin-bottom: 20px;">
                        <h3 style="color: #007bff; border-bottom: 1px solid #bbdefb; padding-bottom: 10px;">I. CHI TIẾT BOOKING</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 5px 0; font-weight: bold;">Số Booking:</td><td style="padding: 5px 0; color: #dc3545; font-weight: bold;">${bookingNo}</td></tr>
                            <tr><td style="padding: 5px 0; font-weight: bold;">Tour:</td><td style="padding: 5px 0;">${tourTitle}</td></tr>
                            <tr><td style="padding: 5px 0; font-weight: bold;">Ngày khởi hành:</td><td style="padding: 5px 0;">${startDateFormatted}</td></tr>
                            <tr><td style="padding: 5px 0; font-weight: bold;">Số người:</td><td style="padding: 5px 0;">${bookingDetails.numberOfPeople}</td></tr>
                            <tr><td style="padding: 5px 0; font-weight: bold;">Tổng tiền:</td><td style="padding: 5px 0; color: #dc3545; font-weight: bold;">${totalPriceFormatted} VNĐ</td></tr>
                            <tr><td style="padding: 5px 0; font-weight: bold;">Tình trạng:</td><td style="padding: 5px 0; color: #ffc107; font-weight: bold;">CHỜ THANH TOÁN</td></tr>
                        </table>
                    </div>
                    
                    <h3 style="color: #007bff;">II. HOÀN TẤT THANH TOÁN</h3>
                    <p>Vui lòng hoàn tất thanh toán để giữ chỗ và xác nhận chuyến đi:</p>
                    
                    <div style="text-align: center; margin-bottom: 20px;">
                        <a href="${vnpUrl}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            THANH TOÁN QUA VNPAY NGAY
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #555;">
                        **Lưu ý:** Booking của bạn sẽ được giữ chỗ tạm thời. Nếu không thanh toán trước thời hạn (thường là 3 ngày kể từ ngày đặt), booking có thể bị hủy.
                    </p>
                    
                    <hr style="border-top: 1px solid #bbdefb;">
                    <p>Trân trọng,<br>Đội ngũ Tour Du Lịch</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email xác nhận Booking đã gửi: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('Lỗi khi gửi email xác nhận Booking:', error);
        return false;
    }
};
const sendPaymentConfirmationEmail = async (email, bookingDetails, tourTitle) => {
    try {
        // Định dạng ngày tháng
        const startDateFormatted = new Date(bookingDetails.startDate).toLocaleDateString('vi-VN');
        const totalPriceFormatted = bookingDetails.totalPrice.toLocaleString('vi-VN');
        // Tạo mã booking ngắn gọn (ví dụ: 8 ký tự cuối của ID)
        const bookingNo = bookingDetails._id.toString().slice(-8).toUpperCase(); 

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `✅ Xác Nhận Thanh Toán Thành Công Đơn Hàng #${bookingNo}`, // Tiêu đề xác nhận thanh toán
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #28a745; max-width: 600px; background-color: #d4edda;">
                    <h2 style="color: #28a745; text-align: center;">🎉 THANH TOÁN THÀNH CÔNG 🎉</h2>
                    <p>Kính gửi bạn,</p>
                    <p>Chúng tôi xác nhận Booking cho Tour **${tourTitle}** của bạn đã được thanh toán thành công. Booking của bạn hiện đã được **xác nhận**.</p>
                    
                    <div style="background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #c3e6cb; margin-bottom: 20px;">
                        <h3 style="color: #28a745; border-bottom: 1px solid #c3e6cb; padding-bottom: 10px;">I. CHI TIẾT BOOKING</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 5px 0; font-weight: bold;">Số Booking:</td><td style="padding: 5px 0; color: #dc3545; font-weight: bold;">${bookingNo}</td></tr>
                            <tr><td style="padding: 5px 0; font-weight: bold;">Tour:</td><td style="padding: 5px 0;">${tourTitle}</td></tr>
                            <tr><td style="padding: 5px 0; font-weight: bold;">Ngày khởi hành:</td><td style="padding: 5px 0;">${startDateFormatted}</td></tr>
                            <tr><td style="padding: 5px 0; font-weight: bold;">Số người:</td><td style="padding: 5px 0;">${bookingDetails.numberOfPeople}</td></tr>
                            <tr><td style="padding: 5px 0; font-weight: bold;">Tổng tiền:</td><td style="padding: 5px 0; color: #28a745; font-weight: bold;">${totalPriceFormatted} VNĐ</td></tr>
                            <tr><td style="padding: 5px 0; font-weight: bold;">Tình trạng:</td><td style="padding: 5px 0; color: #28a745; font-weight: bold;">ĐÃ THANH TOÁN (PAID)</td></tr>
                        </table>
                    </div>
                    
                    <p style="font-size: 14px; color: #555;">
                       Cảm ơn quý khách đã đăng ký tour. Xin hãy sắp xếp đến đúng thời gian quy định nhé.
                    </p>
                    
                    <hr style="border-top: 1px solid #c3e6cb;">
                    <p>Trân trọng,<br>Đội ngũ Tour Du Lịch</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email xác nhận thanh toán đã gửi: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('Lỗi khi gửi email xác nhận thanh toán:', error);
        return false;
    }
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendBookingConfirmationEmail,
    sendPaymentConfirmationEmail,
};