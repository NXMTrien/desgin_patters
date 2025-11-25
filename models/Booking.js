// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true
  },
  customTour: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomTourRequest' },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  numberOfPeople: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
        type: Date,
        required: false 
    },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed','pending_payment'],
    default: 'pending'
  },
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }] 
    

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);