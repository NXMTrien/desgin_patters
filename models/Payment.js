// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    
    
   
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        
    },
    
    
    method: {
        type: String,
        required: true,
        
        enum: ['cash', 'transfer', 'bank', 'momo', 'zalopay', 'other', 'VNPAY'], 
        default: 'transfer'
    },
    
    // Status (Trạng thái thanh toán)
    status: {
        type: String,
        required: true,
        
        enum: ['pending', 'successful', 'failed', 'refunded'],
        default: 'pending'
    },
    
    
    amount: {
        type: Number,
        required: true,
        min: 0
    }

}, { 
    
    timestamps: true 
});

module.exports = mongoose.model('Payment', paymentSchema);