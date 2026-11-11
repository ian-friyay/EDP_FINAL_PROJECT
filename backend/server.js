const express = require('express');
const cors = require('cors');
const supabase = require('./db'); // Imports your Supabase connection
const servicesRoutes = require('./routes/servicesRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/services', servicesRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('SerbisYou Backend API is running!');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
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