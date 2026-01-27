const mongoose = require('mongoose');
const Tour = require('./Tour'); // Hãy đảm bảo đường dẫn này chính xác

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

// Đảm bảo mỗi user chỉ được review 1 tour duy nhất 1 lần (Nên mở comment nếu cần)
// reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// --- TÍNH TOÁN RATING ---

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
    await Tour.findByIdAndUpdate(tourId, {
      // Làm tròn 1 chữ số thập phân (VD: 4.666 -> 4.7) để frontend hiển thị đẹp
      ratingsQuantity: stats[0].nRating,
      averageRating: Math.round(stats[0].avgRating * 10) / 10 
      
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      averageRating: 0 
    });
  }
};

// 1. Chạy sau khi lưu (Tạo mới)
reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.tour);
});

/**
 * 2. QUAN TRỌNG: Chạy khi Update hoặc Delete
 * findByIdAndUpdate và findByIdAndDelete thực chất là findOneAnd...
 */
reviewSchema.post(/^findOneAnd/, async function(doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.tour);
  }
});

module.exports = mongoose.model('Review', reviewSchema);