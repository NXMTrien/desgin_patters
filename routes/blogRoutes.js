const express = require('express');
const blogController = require('../controllers/blogController');
const { protect, checkAdmin } = require('../controllers/authControllers'); 
const router = express.Router();

// Tất cả các route admin cần bảo vệ
router.use(protect, checkAdmin); 

// --- ÁP DỤNG MIDDLEWARE (NẾU CẦN) ---
// Ví dụ: router.use(authController.protect); // Bảo vệ tất cả các route bên dưới

// --- ROUTE CÔNG KHAI (GET) ---
// Route: GET /api/blogs
router.get('/', blogController.getAllBlogs); // Dòng 16 (Dòng gây lỗi nếu trước đó bạn viết sai)

router.get('/by-tour/:tourId', blogController.getBlogByTourId);

// --- ROUTE CẦN ADMIN/AUTHOR ---
// Route: POST /api/blogs (Tạo Blog mới)
// Cần bảo vệ bằng admin/author
router.post(
  '/', 
  // authController.protect,           // 1. Kiểm tra đăng nhập
  // authController.restrictTo('admin', 'author'), // 2. Kiểm tra quyền
  blogController.createBlog         // 3. Controller handler
);

// Route chi tiết theo ID
router.route('/:id')
  // .get(blogController.getBlog) // Giả sử bạn có getBlog
  // PATCH /api/blogs/:id
  .patch(
    // authController.protect, 
    // authController.restrictTo('admin', 'author'),
    blogController.updateBlog
  )
  // DELETE /api/blogs/:id
  .delete(
    // authController.protect, 
    // authController.restrictTo('admin'),
    blogController.deleteBlog
  );


module.exports = router;