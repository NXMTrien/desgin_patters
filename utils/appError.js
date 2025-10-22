
class AppError extends Error {
    constructor(message, statusCode) {
        // Gọi constructor của lớp cha (Error)
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Đánh dấu đây là lỗi có thể dự đoán/xử lý được

        // Ghi lại stack trace (dấu vết lỗi)
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;