// controllers/reviewController.js
const Review = require('../models/Review');
const Tour = require('../models/Tour');

// 1. Tạo đánh giá mới
exports.createReview = async (req, res) => {
  try {
    // Cho phép truyền tourId từ URL hoặc body
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    // Kiểm tra xem tour có tồn tại không
    const tour = await Tour.findById(req.body.tour);
    if (!tour) return res.status(404).json({ message: 'Tour không tồn tại' });

    const newReview = await Review.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { review: newReview }
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};


exports.getAllReviewsByTour = async (req, res) => {
  try {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const reviews = await Review.find(filter)
      .populate('user', 'username') // Hiển thị tên người đánh giá
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: { reviews }
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

