const mongoose = require('mongoose');

const customTourRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  destination: { type: String, required: true }, // ✅ Đổi từ title → destination
  durationDays: { type: Number, required: true },
  transportation: { type: String, required: true },
  accommodation: { type: String, required: true },
  activities: [String],
  estimatedPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'quoted', 'confirmed', 'booked', 'rejected'],
    default: 'pending'
  },
  startDate: { type: Date },
  numberOfPeople: { type: Number },
  adminNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CustomTourRequest', customTourRequestSchema);
