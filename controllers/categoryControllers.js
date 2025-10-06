// controllers/categoryController.js
const Category = require('../models/Category'); 

// --- CHỨC NĂNG QUẢN LÝ CATEGORY ---

exports.createCategory = async (req, res) => {
  try {
    const newCategory = await Category.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        category: newCategory
      }
    });
  } catch (error) {
    // Xử lý lỗi trùng lặp (ví dụ: tên category unique)
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: {
        categories
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};

// --- CHỨC NĂNG CẬP NHẬT CATEGORY (UPDATE) ---
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      {
        new: true, // Trả về tài liệu đã được cập nhật
        runValidators: true // Chạy lại các validators trong Schema
      }
    );

    if (!category) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy danh mục để cập nhật.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        category // Danh mục đã được cập nhật
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// --- CHỨC NĂNG XÓA CATEGORY (DELETE) ---
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy danh mục để xóa.'
      });
    }

    // Trả về 204 No Content (thành công nhưng không có nội dung trả về)
    res.status(204).json({
      status: 'success',
      data: null 
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: error.message
    });
  }
};