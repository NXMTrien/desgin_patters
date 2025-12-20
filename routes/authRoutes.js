// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {  registerUser,
  loginUser,
  logoutUser,
  getMe,
  googleLogin,
  getAllUsers,
  updateUser,
  updateMe,
  checkAdmin,
verifyEmail,
forgotPassword,
resetPassword, 
  resendVerificationEmail } = require('../controllers/authControllers');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.post('/google-login', googleLogin);

router.post('/verify-email', verifyEmail);

router.post('/resend-email', resendVerificationEmail);
// forgotPassword
router.post('/reset-password', resetPassword);
router.post('/forgot-password',forgotPassword);

// Lấy danh sách tất cả người dùng
router.get('/users', protect, checkAdmin, getAllUsers);

router.patch('/update-me', protect, updateMe);
// Cập nhật người dùng (role hoặc block)
router.put('/users/:id', protect, checkAdmin, updateUser);

module.exports = router;