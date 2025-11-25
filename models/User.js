// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
    phone: {
        type: String,
        trim: true,
        
    },
    address: {
        type: String,
        trim: true,
    },
    dateOfBirth: {
        type: Date, 
        
    },
    otp: {
        type: String, 
        select: false 
    },
    otpExpires: {
        type: Date, 
        select: false
    },
    resetPasswordOTP: {
    type: String,
    select: false
    },
    resetPasswordExpires: {
    type: Date,
    select: false
    },
    isVerified: {
        type: Boolean, 
        default: false
    },
    gender:{
        type:String
    },
   
    permissions: {
        type: [String], 
        default: ['view_tours'], 
    }
  
}, { timestamps: true });

// Hash mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sánh mật khẩu
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);