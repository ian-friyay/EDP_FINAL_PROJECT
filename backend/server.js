const express = require('express');
const cors = require('cors');
const supabase = require('./db'); // Imports your Supabase connection
const { register, verifyOtp, login } = require('./controllers/authController');
const validatePassword = require('./middleware/validatePassword');
const { rateLimit } = require('express-rate-limit');
const servicesRoutes = require('./routes/servicesRoutes');

const app = express();
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
app.use(express.json());
app.use('/api/services', servicesRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('SerbisYou Backend API is running!');
});

// Database Connection Test Route
app.get('/api/test-db', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('*').limit(1);
        
        if (error) {
            return res.status(500).json({ error: "Connection failed", details: error.message });
        }
        
        res.json({ 
            status: "Success!", 
            message: "Successfully connected to your Supabase database.",
            data: data 
        });
    } catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
});

// Auth Routes
app.post('/api/auth/register', registrationRateLimiter, validatePassword, register);
app.post('/api/auth/verify-otp', otpVerificationLimiter, verifyOtp);
app.post('/api/auth/login', login);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
