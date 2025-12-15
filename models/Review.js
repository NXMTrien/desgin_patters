// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour', // Khớp với bảng Tour trong sơ đồ
    required: [true, 'Đánh giá phải thuộc về một tour nào đó.']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Khớp với bảng User trong sơ đồ
    required: [true, 'Đánh giá phải thuộc về một người dùng.']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Vui lòng cung cấp số sao đánh giá.']
  },
  comment: {
    type: String,
    required: [true, 'Nội dung đánh giá không được để trống.']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Đảm bảo mỗi user chỉ được review 1 tour duy nhất 1 lần (tùy chọn)
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);