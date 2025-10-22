// utils/catchAsync.js

/**
 * Hàm tiện ích này bọc một hàm async (controller) và bắt bất kỳ lỗi nào xảy ra.
 * Nó chuyển lỗi đó (error) sang middleware xử lý lỗi toàn cục (global error handler)
 * bằng cách gọi next(error).
 * * @param {Function} fn - Hàm controller async cần bọc (ví dụ: exports.getAllTours)
 * @returns {Function} - Hàm middleware mới đã được bọc
 */
const catchAsync = fn => {
    return (req, res, next) => {
        // Gọi hàm controller, nếu promise bị reject (có lỗi), 
        // nó sẽ được bắt bởi .catch() và chuyển đến global error handler
        fn(req, res, next).catch(next);
    };
};

module.exports = catchAsync;