// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {  registerUser,
  loginUser,
  logoutUser,
  getMe,
  getAllUsers,
  updateUser,
  checkAdmin,
verifyEmail, 
  resendVerificationEmail } = require('../controllers/authControllers');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

router.post('/verify-email', verifyEmail);

router.post('/resend-email', resendVerificationEmail);


// Lấy danh sách tất cả người dùng
router.get('/users', protect, checkAdmin, getAllUsers);


// Cập nhật người dùng (role hoặc block)
router.put('/users/:id', protect, checkAdmin, updateUser);

module.exports = router;