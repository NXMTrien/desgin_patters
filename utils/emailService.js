const { Resend } = require('resend');

// 1. Khởi tạo Resend thay vì Nodemailer
// Đảm bảo bạn đã cài đặt: npm install resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 2. HÀM GỬI MAIL TỔNG QUÁT (Sử dụng Resend SDK)
 * Hàm này thay thế hoàn toàn logic transporter.sendMail cũ
 */
const sendEmail = async ({ to, subject, html, firstName = "Tourify", lastName = "Magic" }) => {
    try {
        const { data, error } = await resend.emails.send({
            // LƯU Ý: Nếu chưa verify domain, bạn phải dùng 'onboarding@resend.dev'
            // Nếu đã verify domain rồi thì dùng: 'noreply@yourdomain.com'
            from: `${firstName} ${lastName} <onboarding@resend.dev>`,
            to: [to],
            subject: subject,
            html: html,
            // Resend tự động tạo bản text từ HTML, nhưng bạn có thể thêm nếu muốn
            text: html.replace(/<[^>]*>?/gm, ''),
        });

        if (error) {
            console.error("❌ Resend API Error:", error);
            return false;
        }

        console.log("✅ Email sent successfully, ID:", data.id);
        return true;
    } catch (err) {
        console.error("❌ System Error sending email:", err);
        return false;
    }
};

// --- CÁC HÀM TIỆN ÍCH (Giữ nguyên cấu trúc gọi hàm sendEmail) ---

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
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendBookingConfirmationEmail,
    sendPaymentConfirmationEmail,
    sendBookingCancellationEmail,
};