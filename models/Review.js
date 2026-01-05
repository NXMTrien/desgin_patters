const mongoose = require('mongoose');
const Tour = require('./Tour'); // Import Model Tour để cập nhật điểm

const reviewSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Đánh giá phải thuộc về một tour nào đó.']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
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

// Đảm bảo mỗi user chỉ được review 1 tour duy nhất 1 lần
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// --- ĐOẠN CODE THÊM MỚI: TÍNH TOÁN RATING ---

// 1. Hàm Static để tính trung bình cộng
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    // SỬA TẠI ĐÂY: Dùng đúng tên 'averageRating' như trong Tour.js của bạn
    await Tour.findByIdAndUpdate(tourId, {
      averageRating: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      averageRating: 0 // Reset về 0 nếu không còn đánh giá nào
    });
  }
};

// Gọi hàm sau khi lưu review mới
reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.tour);
});

// Chặn không cho lưu xuống dưới module.exports
module.exports = mongoose.model('Review', reviewSchema);