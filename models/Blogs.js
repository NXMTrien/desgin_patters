const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    Id_Tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour', // Giả định bạn có Tour Model
        required: [true, 'Blog phải thuộc về một Tour.'],
    },
    title: {
        type: String,
        required: [true, 'Blog phải có tiêu đề.'],
        trim: true,
        maxlength: [100, 'Tiêu đề không được quá 100 ký tự.'],
    },
    // Chuyển Description thành một Object chứa 3 phần con
    description: {
        type: {
            detail: {
                type: String,
                required: [true, 'Phần mô tả chi tiết là bắt buộc.'],
            },
            attractions: {
                type: String, // Có thể lưu dưới dạng JSON String/Array hoặc String lớn
                required: [true, 'Danh sách tham quan là bắt buộc.'],
            },
            meaningful_description: {
                type: String,
                required: [true, 'Phần mô tả chuyến đi ý nghĩa là bắt buộc.'],
            },
        },
        required: [true, 'Nội dung Blog là bắt buộc.'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;