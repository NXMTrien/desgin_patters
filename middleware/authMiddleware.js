const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // Kiểm tra header có chứa token không
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      status: 'fail',
      message: 'Không có token, vui lòng đăng nhập lại.' 
    });
  }

  try {
    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy user tương ứng trong DB
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return res.status(401).json({ 
        status: 'fail',
        message: 'Người dùng không tồn tại hoặc đã bị xóa.' 
      });
    }

    // Gắn user vào request để các middleware sau có thể truy cập
    req.user = currentUser;

    // Log kiểm tra
    console.log("✅ Đã xác thực người dùng:", req.user.email, "| role:", req.user.role);

    next();
  } catch (error) {
    console.error("❌ Lỗi xác thực token:", error.message);
    return res.status(401).json({ 
      status: 'fail',
      message: 'Token không hợp lệ hoặc đã hết hạn.' 
    });
  }
};
