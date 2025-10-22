// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserFactory = require('../patterns/UserFactory');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

exports.checkAdmin = (req, res, next) => {
    // Giả định middleware `protect` đã chạy và gán user vào req.user
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: '🚫 Bạn không có quyền truy cập chức năng này.' });
    }
};



exports.getAllUsers = async (req, res) => {
    try {
       
        const users = await User.find().select('-password');
        
       
        const formattedUsers = users.map(user => ({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked || false, 
        }));

        res.status(200).json({
            count: formattedUsers.length,
            users: formattedUsers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, isBlocked } = req.body;
        const updateFields = {};

        // 1. Chỉ Admin mới được update role
        if (role && (role === 'user' || role === 'admin')) {
            updateFields.role = role;
        }

        // 2. Cập nhật trạng thái Block
        if (typeof isBlocked === 'boolean') {
            updateFields.isBlocked = isBlocked;
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: 'Không có trường nào hợp lệ để cập nhật.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        res.status(200).json({
            message: 'Cập nhật người dùng thành công',
            user: updatedUser
        });

    } catch (error) {
        // Xử lý lỗi validation hoặc server
        res.status(400).json({ message: error.message });
    }
};

exports.registerUser = async (req, res) => {
  try {
    // 1. Lấy dữ liệu từ body
    const { username, email, password } = req.body;
    
    // 2. Gán giá trị mặc định là "user" cho role nếu role không được cung cấp hoặc là null/undefined
    let { role } = req.body;
    if (!role) {
      role = 'user'; // Tự động gán là 'user'
    }

    // Sử dụng Factory Pattern để tạo đối tượng người dùng
    const newUser = UserFactory.createUser({ username, email, role });
    
    // Lưu vào database
    const user = new User({ ...newUser, password });
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: newUser.permissions,
      token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // Sử dụng Factory Pattern để lấy quyền của người dùng khi đăng nhập
      // user._doc chứa dữ liệu Mongoose thuần, cần thiết khi clone object
      const userInstance = UserFactory.createUser({ ...user._doc, role: user.role });

      const token = generateToken(user._id, user.role);
      
      res.json({
        // Thêm trường 'message' theo yêu cầu
        message: 'Logins successfully',
        
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: userInstance.permissions,
        token,
      });
    } else {
      // Giữ nguyên logic lỗi
      res.status(401).json({ message: 'Email hoặc mật khẩu không hợp lệ' });
    }
  } catch (error) {
    // Giữ nguyên logic lỗi server
    res.status(500).json({ message: error.message });
  }
};

exports.logoutUser = (req, res) => {
  // Logic đơn giản: Frontend chỉ cần xóa token khỏi local storage hoặc cookie
  res.status(200).json({ message: 'Logged out successfully' });
};

exports.getMe = (req, res) => {
  // Lấy thông tin người dùng từ token đã giải mã
  const { user } = req;
  const userInstance = UserFactory.createUser({ ...user._doc, role: user.role });
  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: userInstance.permissions
  });
};