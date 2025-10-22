// models/Tour.js
const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true, trim: true },
  destination: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, required: true, min: 1 }, 
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  averageRating: { type: Number, default: 0 },
  maxGroupSize: { type: Number, required: true, min: 1 },
  // Thêm các trường khác: images, dates, v.v.
}, { timestamps: true });

module.exports = mongoose.model('Tour', tourSchema);