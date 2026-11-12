const http = require('http');
const express = require('express');
const cors = require('cors');
const supabase = require('./db');
const messageRoutes = require('./routes/messageRoutes');
const { initSocket } = require('./socket/socketServer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/messages', messageRoutes);

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

const server = http.createServer(app);
const io = initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server, io };
