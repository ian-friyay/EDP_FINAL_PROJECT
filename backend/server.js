const express = require('express');
const http = require('http');
const cors = require('cors');
const supabase = require('./db'); // Imports your Supabase connection
const { register, verifyOtp, resendOtp, forgotPassword, resetPassword, login } = require('./controllers/authController');
const validatePassword = require('./middleware/validatePassword');
const { requireAuth } = require('./middleware/authMiddleware');
const { rateLimit } = require('express-rate-limit');
const servicesRoutes = require('./routes/servicesRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const cancelTransactionRoutes = require('./routes/cancelTransactionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewsRoutes = require('./routes/reviewsRoutes');
const storageRoutes = require('./routes/storageRoutes');
const { initSocket } = require('./socket/socketServer');

const app = express();
const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

const registrationRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many registration attempts. Please try again later.' }
});
const otpVerificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many verification attempts. Please try again later.' }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/services', servicesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transactions', cancelTransactionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/storage', storageRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('SerbisYou Backend API is running!');
});

// Database Connection Test Route
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
      return res.status(500).json({
        error: 'Connection failed',
        details: error.message,
      });
    }

    res.json({
      status: 'Success!',
      message: 'Successfully connected to your Supabase database.',
      data,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Auth Routes
app.post('/api/auth/register', registrationRateLimiter, validatePassword, register);
app.post('/api/auth/verify-otp', otpVerificationLimiter, verifyOtp);
app.post('/api/auth/resend-otp', otpVerificationLimiter, resendOtp);
app.post('/api/auth/forgot-password', otpVerificationLimiter, forgotPassword);
app.post('/api/auth/reset-password', otpVerificationLimiter, validatePassword, resetPassword);
app.post('/api/auth/login', login);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server, io };
