// app.js
const dotenv = require('dotenv');
dotenv.config();


const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const tourRoutes = require('./routes/tourRoutes'); 
const bookingRoutes = require('./routes/bookingRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const customTourRoutes = require('./routes/customTourRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const blogRouter = require('./routes/blogRoutes');
const reviewRouter = require('./routes/reviewRoutes');



const app = express();
app.use('/img/tours', express.static(path.join(process.cwd(), 'public', 'img', 'tours')));


app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PATCH","PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// Kết nối với MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error(err));

app.use(express.json());

// Sử dụng routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/custom-tours', customTourRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/blogs', blogRouter);
app.use('/api/tours/:tourId/reviews', reviewRouter);
app.use('/api/reviews', reviewRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));