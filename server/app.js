const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('../routes/auth');
const assetRoutes = require('../routes/assets');
const dashboardRoutes = require('../routes/dashboard');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/views', express.static(path.join(__dirname, '../views')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route - redirect to login
app.get('/', (req, res) => {
  res.redirect('/views/login.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

module.exports = app;
