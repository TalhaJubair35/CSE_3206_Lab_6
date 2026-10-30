const express = require('express');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

module.exports = app;
