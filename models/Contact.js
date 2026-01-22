const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  type: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  company: String,
  numberOfGuests: { type: Number, default: 0 },
  message: { type: String, required: true },
  status: { type: String, default: 'Chưa xử lý', enum: ['Chưa xử lý', 'Đã xử lý'] },
  createdAt: { type: Date, default: Date.now } // Quan trọng để lọc theo ngày
});

module.exports = mongoose.model('Contact', contactSchema);