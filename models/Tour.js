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
 imageCover: {
        type: String, // Tên file hoặc URL của ảnh chính
        required: [true, 'Tour cần có một ảnh bìa (cover image) chính.']
    },
    images: {
        type: [String], 
        validate: {
            validator: function(val) {
                
               
                return val.length <= 5; 
            },
            message: 'Tour chỉ có thể có tối đa 5 ảnh phụ.'
        },
        default: []
    },
    // ----------------------------------------------------
}, { timestamps: true });

module.exports = mongoose.model('Tour', tourSchema);