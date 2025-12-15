const Blog = require('../models/Blogs');
const catchAsync = require('../utils/catchAsync'); 

// READ: Lấy tất cả Blogs (có thể thêm populate Tour)
exports.getAllBlogs = catchAsync(async (req, res, next) => {
    const blogs = await Blog.find().populate('Id_Tour');

    res.status(200).json({
        status: 'success',
        results: blogs.length,
        data: { blogs }
    });
});
// READ: Lấy Blogs theo Id_tour
exports.getBlogByTourId = catchAsync(async (req, res, next) => {
    const blog = await Blog.findOne({ Id_Tour: req.params.tourId }).populate('Id_Tour');

    if (!blog) {
        // Sử dụng AppError nếu có, nếu không thì dùng new Error
        return next(new AppError('Không tìm thấy Blog liên quan đến Tour này.', 404)); 
    }

    res.status(200).json({
        status: 'success',
        data: { blog }
    });
});
// CREATE: Tạo Blog mới
exports.createBlog = catchAsync(async (req, res, next) => {
    // Frontend sẽ gửi body có cấu trúc: { Id_Tour: '...', title: '...', description: { detail: '...', attractions: '...', meaningful_description: '...' } }
    const newBlog = await Blog.create(req.body);

    res.status(201).json({
        status: 'success',
        data: { blog: newBlog }
    });
});

// UPDATE: Cập nhật Blog
exports.updateBlog = catchAsync(async (req, res, next) => {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // Trả về tài liệu đã cập nhật
        runValidators: true // Chạy lại các validators trong Schema
    });

    if (!blog) {
        return next(new Error('Không tìm thấy Blog với ID này.', 404)); // Giả định bạn có Global Error Handler
    }

    res.status(200).json({
        status: 'success',
        data: { blog }
    });
});

// DELETE: Xóa Blog
exports.deleteBlog = catchAsync(async (req, res, next) => {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
        return next(new Error('Không tìm thấy Blog với ID này.', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});