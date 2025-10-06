// middleware/permissionMiddleware.js

// Hàm middleware để kiểm tra vai trò của người dùng
const restrictTo = (roles) => {
  return (req, res, next) => {
    // req.user được gán từ authMiddleware (protect)
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Bạn không có quyền thực hiện hành động này.' 
      });
    }
    next();
  };
};

module.exports = { restrictTo };