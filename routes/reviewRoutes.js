// routes/reviewRoutes.js
const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true }); 

router
  .route('/')
  .get(reviewController.getAllReviewsByTour)
  .post(protect, reviewController.createReview);

module.exports = router;