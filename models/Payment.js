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
        
        enum: ['pending', 'transfer', 'successful', 'failed', 'awaiting_confirmation','VNPAY'],
        default: 'pending'
    },
    
    // Status (Trạng thái thanh toán)
    status: {
        type: String,
        required: true,
        
        enum: ['pending', 'successful', 'failed', 'awaiting_confirmation'],
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