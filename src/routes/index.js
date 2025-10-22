const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const clinicRoutes = require('./clinicRoutes');
const doctorRoutes = require('./doctorRoutes');
const articleRoutes = require('./articleRoutes');
const serviceRoutes = require('./serviceRoutes');
const commentRoutes = require('./commentRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/clinics', clinicRoutes);
router.use('/doctors', doctorRoutes);
router.use('/articles', articleRoutes);
router.use('/services', serviceRoutes);
router.use('/comments', commentRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

