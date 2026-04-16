// backend/server.js (update with routes)
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const technicianProfileRoutes = require('./routes/technicianProfileRoutes');
const serviceCatalogRoutes = require('./routes/serviceCatalogRoutes');
const searchRoutes=require('./routes/searchRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/technician', technicianProfileRoutes);
app.use('/api/service-catalog', serviceCatalogRoutes);
app.use('/api/search', searchRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Weba-Hub API' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/weba-hub')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});