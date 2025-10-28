require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const sessionConfig = require('./src/config/session');
const routes = require('./src/routes');
const { errorHandler, notFound } = require('./src/middlewares/errorHandler');
const { generateCsrfToken, validateCsrfToken } = require('./src/middlewares/csrf');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Rate limiting - Improved version
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per windowMs
  message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // ترکیب session user ID با IP برای دقت بیشتر
    return req.session?.userId || req.ip;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
  standardHeaders: true,
  keyGenerator: (req) => {
    return req.ip; // برای auth از IP استفاده کنید
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً 15 دقیقه بعد تلاش کنید.',
    });
  },
});
app.use('/api/auth/request-otp', authLimiter);
app.use('/api/auth/verify-otp', authLimiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Session
app.use(session(sessionConfig));

// CSRF token middleware
app.use(generateCsrfToken);
app.use(validateCsrfToken);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api', routes);

// Swagger setup
const swaggerSetup = require('./swagger-setup');
swaggerSetup(app);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Dental Appointment System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      clinics: '/api/clinics',
      doctors: '/api/doctors',
      articles: '/api/articles',
      services: '/api/services',
      comments: '/api/comments',
    },
  });
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

