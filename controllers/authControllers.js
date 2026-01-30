// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserFactory = require('../patterns/UserFactory');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateOTP = () => {
    // Tạo mã 6 chữ số ngẫu nhiên
    return Math.floor(100000 + Math.random() * 900000).toString();
};


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
exports.updateMe = async (req, res) => {
    try {
        // 1. Lấy dữ liệu từ body (Chỉ cho phép sửa các trường này)
        const { phone, address, dateOfBirth } = req.body;
        
        // 2. Tạo đối tượng chứa các trường cần cập nhật
        const updateFields = {};
        if (phone !== undefined) updateFields.phone = phone;
        if (address !== undefined) updateFields.address = address;
        if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth;

        // Kiểm tra nếu không có dữ liệu nào được gửi lên
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: 'Không có thông tin nào để cập nhật.' });
        }

        // 3. Thực hiện cập nhật dựa trên ID của người dùng đang đăng nhập (req.user.id)
        // Chúng ta lấy ID từ token (middleware protect đã gán vào req.user) để đảm bảo an toàn
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, 
            updateFields, 
            { 
                new: true,           // Trả về bản ghi mới nhất
                runValidators: true  // Kiểm tra ràng buộc dữ liệu (vd: định dạng số điện thoại)
            }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Cập nhật thông tin cá nhân thành công',
            user: updatedUser
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.registerUser = async (req, res) => {
    try {
        const { 
            username, email, password, confirmPassword, // 1. Lấy confirmPassword từ req.body
            phone, address, dateOfBirth 
        } = req.body;

        // --- MỚI: KIỂM TRA XÁC NHẬN MẬT KHẨU ---
        if (!confirmPassword) {
            return res.status(400).json({ message: 'Vui lòng xác nhận mật khẩu.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp. Vui lòng thử lại.' });
        }
        // ---------------------------------------

        // 2. Kiểm tra Trùng lặp Email/Username (Giữ nguyên)
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
             if (!existingUser.isVerified) {
                 return res.status(400).json({ 
                     message: `Tài khoản với email ${email} đang chờ xác thực. Vui lòng kiểm tra email hoặc nhấn 'Gửi lại mã'.`,
                     email: email 
                 });
             }
             
             if (existingUser.email === email) {
                 return res.status(409).json({ message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác.' });
             }
             if (existingUser.username === username) {
                 return res.status(409).json({ message: 'Tên người dùng này đã tồn tại. Vui lòng chọn tên khác.' });
             }
        }
        
        // 3. Kiểm tra Ràng buộc Tuổi tối thiểu (Giữ nguyên)
        if (!dateOfBirth) {
            return res.status(400).json({ message: 'Vui lòng cung cấp Ngày sinh (dateOfBirth).' });
        }
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        const MINIMUM_AGE = 18;
        if (age < MINIMUM_AGE) {
            return res.status(403).json({ message: `Bạn phải đủ ${MINIMUM_AGE} tuổi trở lên để đăng ký tài khoản.` });
        }
        
        // 4. Chuẩn bị OTP (Giữ nguyên)
        const otpCode = generateOTP(); 
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

        // 5. Gán Role mặc định
        let { role } = req.body;
        if (!role) { role = 'user'; }

        // 6. Tạo đối tượng qua Factory Pattern
        // Lưu ý: confirmPassword không được đưa vào đây
        const userData = { username, email, role, phone, address, dateOfBirth };
        const newUserData = UserFactory.createUser(userData);
        
        // 7. Tạo đối tượng Mongoose
        const user = new User({ 
            ...newUserData, 
            password, // Password sẽ được hash bởi middleware trong Schema (nếu có)
            phone: phone || null, 
            address: address || null,
            dateOfBirth: dateOfBirth || null,
            isVerified: false,
            otp: otpCode,
            otpExpires: otpExpires,
        });
        
        await user.save(); // confirmPassword hoàn toàn không tồn tại trong object này nên không thể lưu vào DB
        
        // 8. GỬI EMAIL XÁC THỰC
        const isEmailSent = await sendVerificationEmail(email, otpCode);

        if (!isEmailSent) {
            await User.findByIdAndDelete(user._id); 
            return res.status(500).json({ 
                message: 'Đăng ký thất bại: Không thể gửi mã xác thực. Vui lòng thử lại sau.' 
            });
        }
        
        // 9. Thành công
        res.status(201).json({
            message: 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực (OTP).',
            _id: user._id,
            username: user.username,
            email: user.email,
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

exports.getMe = async (req, res) => {
  try {
    // req.user.id lấy từ middleware protect
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userInstance = UserFactory.createUser({ ...user._doc, role: user.role });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      permissions: userInstance.permissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        // 1. 🚨 SỬA LỖI: PHẢI DÙNG .select() để lấy các trường otp/otpExpires (vì chúng bị ẩn trong Model)
        const user = await User.findOne({ email }).select('+otp +otpExpires'); 

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Tài khoản đã được xác thực trước đó.' });
        }

        // 2. 🚨 SỬA LỖI: Kiểm tra thời gian hết hạn trước (Dùng tên trường đã cập nhật: otpExpires)
        // new Date() lớn hơn user.otpExpires nghĩa là mã đã hết hạn.
        if (user.otpExpires < new Date()) { 
             // 💡 Gợi ý: Sau khi mã hết hạn, bạn nên xóa OTP trong DB để người dùng phải gửi lại
            // user.otp = undefined;
            // user.otpExpires = undefined;
            // await user.save();
            return res.status(401).json({ message: 'Mã xác thực đã hết hạn. Vui lòng gửi lại mã.' });
        }
        
        // 3. 🚨 SỬA LỖI: So sánh mã OTP (Dùng tên trường đã cập nhật: otp)
        // So sánh chuỗi (string) để đảm bảo độ chính xác
        if (user.otp !== otp) {
            return res.status(401).json({ message: 'Mã xác thực không hợp lệ.' });
        }

        // 4. Xác thực thành công
        user.isVerified = true;
        user.otp = undefined; 
        user.otpExpires = undefined;

        await user.save();
        
        // 5. Cấp token (tùy chọn) và trả về thông tin
        const token = generateToken(user._id, user.role); 
        const userInstance = UserFactory.createUser({ ...user._doc, role: user.role });

        res.status(200).json({
            message: 'Xác thực email thành công! Bạn đã có thể đăng nhập.',
            _id: user._id,
            username: user.username,
            role: user.role,
            permissions: userInstance.permissions,
            token,
        });

    } catch (error) {
        console.error("Lỗi trong quá trình xác thực email:", error);
        res.status(500).json({ message: 'Lỗi Server nội bộ: ' + error.message });
    }
};


exports.resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng với email này.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Tài khoản này đã được xác thực. Vui lòng đăng nhập.' });
        }
        
        // RÀNG BUỘC CHỐNG LẠM DỤNG (THROTTLING): Cho phép gửi lại sau 1 phút
        if (user.verificationCodeExpires && user.verificationCodeExpires > new Date(Date.now() + 60000)) { 
            return res.status(429).json({ 
                message: 'Vui lòng chờ ít nhất 1 phút giữa các lần gửi lại mã xác thực.' 
            });
        }
        
        // Tạo mã OTP mới và thời gian hết hạn mới
        const newVerificationCode = generateOTP(); // Sử dụng hàm generateOTP đã có ở trên
        const newCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        // Cập nhật vào DB
        user.verificationCode = newVerificationCode;
        user.verificationCodeExpires = newCodeExpires;
        await user.save();
        
        // Gửi email mới (sử dụng hàm đã import ở đầu file)
        const isEmailSent = await sendVerificationEmail(email, newVerificationCode);
        
        if (!isEmailSent) {
            console.error(`Không thể gửi lại email xác thực cho ${email}`);
            // Không chặn người dùng, nhưng thông báo lỗi cụ thể hơn có thể tốt hơn
        }

        res.status(200).json({
            message: 'Mã xác thực mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
            email: user.email,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email.' });
        }

       
        const user = await User.findOne({ email });

        if (!user || !user.isVerified) {
           
            return res.status(404).json({ message: 'Không tìm thấy người dùng hoặc tài khoản chưa được xác thực.' });
        }
        
        // 1. Tạo Reset OTP
        const resetOtpCode = generateOTP(); 
       
        const resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); 

        
        user.resetPasswordOTP = resetOtpCode;
        user.resetPasswordExpires = resetOtpExpires;

        
        await user.save({ validateBeforeSave: false }); 
        
       
        const isEmailSent = await sendPasswordResetEmail(user.email, resetOtpCode); 

        if (!isEmailSent) {
            console.error(`Lỗi: Không thể gửi email đặt lại mật khẩu cho ${email}.`);
            return res.status(500).json({ 
                message: 'Gửi email thất bại: Không thể gửi mã đặt lại mật khẩu. Vui lòng thử lại sau.' 
            });
        }

        // 4. Thành công
        res.status(200).json({
            message: 'Mã đặt lại mật khẩu (OTP) đã được gửi đến email của bạn. Mã sẽ hết hạn sau 10 phút.',
            email: user.email,
        });

    } catch (error) {
        console.error("Lỗi trong quá trình quên mật khẩu:", error);
        res.status(500).json({ message: 'Lỗi Server nội bộ: ' + error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng cung cấp Email, Mã OTP và Mật khẩu mới.' });
        }
        
        
        const user = await User.findOne({ email }).select('+resetPasswordOTP +resetPasswordExpires'); 

        if (!user || !user.isVerified) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng hoặc tài khoản chưa được xác thực.' });
        }

        // 2. Kiểm tra thời gian hết hạn
        if (!user.resetPasswordOTP || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) { 
            return res.status(401).json({ message: 'Mã đặt lại mật khẩu đã hết hạn hoặc không tồn tại. Vui lòng gửi lại yêu cầu.' });
        }

       
        if (user.resetPasswordOTP !== otp) {
            return res.status(401).json({ message: 'Mã đặt lại mật khẩu không hợp lệ.' });
        }
        
        
        user.password = newPassword; 
        user.resetPasswordOTP = undefined; 
        user.resetPasswordExpires = undefined; 
        
        await user.save(); 

        // 5. Thành công
        res.status(200).json({
            message: 'Đặt lại mật khẩu thành công. Bạn đã có thể đăng nhập bằng mật khẩu mới.',
        });

    } catch (error) {
        console.error("Lỗi trong quá trình đặt lại mật khẩu:", error);
        
        res.status(400).json({ message: 'Đặt lại mật khẩu thất bại: ' + error.message });
    }
};

exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload.email_verified) {
    return res.status(401).json({ message: 'Email chưa được xác thực' });
  }

  let user = await User.findOne({ email: payload.email });

  if (!user) {
    user = await User.create({
      username: payload.name,
      email: payload.email,
      avatar: payload.picture,
      googleId: payload.sub,
      role: 'user',
      isVerified: true,
      password: Math.random().toString(36).slice(-12) + "Aa1!",
    });
  }

  if (user.isBlocked) {
    return res.status(403).json({ message: 'Tài khoản bị khóa' });
  }

  const token = generateToken(user._id, user.role);

  res.json({
    message: 'Google login success',
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    }
  });
};