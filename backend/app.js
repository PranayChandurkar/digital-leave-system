const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const leaveRoutes = require('./routes/leaveRoutes');

// Initialize Cron Jobs
require('./services/cronService');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Backend is running"
  });
});


module.exports = app;