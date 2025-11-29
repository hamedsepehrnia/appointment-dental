const express = require("express");
const router = express.Router();

const authRoutes = require('./authRoutes');
const clinicRoutes = require('./clinicRoutes');
const doctorRoutes = require('./doctorRoutes');
const articleRoutes = require('./articleRoutes');
const serviceRoutes = require('./serviceRoutes');
const commentRoutes = require('./commentRoutes');
const settingsRoutes = require('./settingsRoutes');
const faqRoutes = require('./faqRoutes');
const galleryRoutes = require('./galleryRoutes');
const insuranceRoutes = require('./insuranceRoutes');
const contactRoutes = require('./contactRoutes');
const categoryRoutes = require('./categoryRoutes');
const doctorApplicationRoutes = require('./doctorApplicationRoutes');
const uploadRoutes = require('./uploadRoutes');
const userRoutes = require('./userRoutes');
const reviewRoutes = require('./reviewRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/clinics', clinicRoutes);
router.use('/doctors', doctorRoutes);
router.use('/articles', articleRoutes);
router.use('/services', serviceRoutes);
router.use('/comments', commentRoutes);
router.use('/settings', settingsRoutes);
router.use('/faqs', faqRoutes);
router.use('/gallery', galleryRoutes);
router.use('/insurance', insuranceRoutes);
router.use('/contact', contactRoutes);
router.use('/categories', categoryRoutes);
router.use('/doctor-applications', doctorApplicationRoutes);
router.use('/upload', uploadRoutes);
router.use('/users', userRoutes);
router.use('/reviews', reviewRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
