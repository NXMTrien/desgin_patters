const mongoose = require('mongoose');

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

// THUẬT TOÁN TÍNH TOÁN
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  console.log('--- ĐANG CHẠY AGGREGATE CHO TOUR:', tourId);

  const stats = await this.aggregate([
    {
      $match: { tour: new mongoose.Types.ObjectId(tourId) }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  console.log('--- KẾT QUẢ STATS TỪ ATLAS:', stats);

  if (stats.length > 0) {
    const updatedTour = await mongoose.model('Tour').findByIdAndUpdate(
      tourId, 
      {
        ratingsQuantity: stats[0].nRating,
        averageRating: Math.round(stats[0].avgRating * 10) / 10
      },
      { new: true, runValidators: false } 
    );
    
    // LOG NÀY SẼ XÁC NHẬN DỮ LIỆU ĐÃ VÀO DB CHƯA
    console.log('--- KẾT QUẢ TOUR SAU KHI UPDATE TRONG DB:', {
        id: updatedTour._id,
        rating: updatedTour.averageRating,
        quantity: updatedTour.ratingsQuantity
    });
  } else {
    await mongoose.model('Tour').findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      averageRating: 0
    });
    console.log('--- ĐÃ RESET RATING VỀ 0 ---');
  }
};

// MIDDLEWARE
reviewSchema.post('save', function() {
  console.log('--- MIDDLEWARE SAVE ĐÃ CHẠY ---');
  this.constructor.calcAverageRatings(this.tour);
});

// DÀNH CHO MONGOOSE 7+ (XỬ LÝ UPDATE/DELETE)
reviewSchema.post(/^findOneAnd/, async function(doc) {
  if (doc) {
    console.log('--- MIDDLEWARE UPDATE/DELETE ĐÃ CHẠY ---');
    await doc.constructor.calcAverageRatings(doc.tour);
  }
});

module.exports = mongoose.model('Review', reviewSchema);