// models/CustomTourRequest.js
const mongoose = require('mongoose');

const customTourRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Yêu cầu người dùng phải đăng nhập
  },
  destination: { type: String, required: true },
  durationDays: { type: Number, required: true },
  transportation: { type: String, required: true },
  accommodation: { type: String, required: true },
  activities: [String], // Lưu danh sách các hoạt động
  estimatedPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'quoted', 'booked', 'rejected'],
    default: 'pending' // Admin cần xem xét yêu cầu này
  },
  adminNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CustomTourRequest', customTourRequestSchema);