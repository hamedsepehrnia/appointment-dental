require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");

const sessionConfig = require("./src/config/session");
const routes = require("./src/routes");
const { errorHandler, notFound } = require("./src/middlewares/errorHandler");
const { setupCleanupJob } = require("./src/utils/cleanupJob");
const { setupReminderJob } = require("./src/utils/reminderJob");
const performanceHeaders = require("./src/middlewares/performanceHeaders");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve mode: 'combined' = serve frontend + backend, 'backend' = backend API only
const SERVE_MODE = process.env.SERVE_MODE || "combined";

// ============================================
// PERFORMANCE: Compression with optimal settings
// ============================================
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Compress text-based responses
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Security middleware with enhanced configuration
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP - React app handles its own security
    hsts:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
          }
        : {
            maxAge: 31536000,
            includeSubDomains: true,
          }, // Enable HSTS even in production mode on server
    crossOriginEmbedderPolicy: false, // For compatibility with some APIs
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
  })
);

// WWW to non-WWW redirect (URL Canonicalization)
app.use((req, res, next) => {
  const host = req.headers.host;
  if (host && host.startsWith('www.')) {
    const newHost = host.replace(/^www\./, '');
    return res.redirect(301, `${req.protocol}://${newHost}${req.originalUrl}`);
  }
  next();
});

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  'https://avatar-distinguished-rim-heights.trycloudflare.com'
];
app.use(
  cors({
    // origin: (origin, callback) => {
    //   // Allow requests with no origin (like mobile apps or curl requests)
    //   if (!origin || allowedOrigins.includes(origin)) {
    //     callback(null, true);
    //   } else {
    //     callback(new Error("Not allowed by CORS"));
    //   }
    // },
    origin:true, 
    credentials: true,
    exposedHeaders: ["Content-Length", "Content-Type"],
  })
);
// Disable cache only for API routes
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Rate limiting - disabled in development mode
if (process.env.NODE_ENV !== "development") {
  // Rate limiting with better key generation
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.",
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", limiter);

  // Stricter rate limit for OTP request
  const otpRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 OTP requests per 15 minutes
    message:
      "تعداد درخواست‌های کد تأیید بیش از حد مجاز است. لطفاً بعداً تلاش کنید.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Stricter rate limit for OTP verification
  const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    message: "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً بعداً تلاش کنید.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply to specific routes
  app.use("/api/auth/request-otp", otpRequestLimiter);
  app.use("/api/auth/verify-otp", otpVerifyLimiter);

  // Stricter rate limit for login endpoint
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per 15 minutes
    message: "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً بعداً تلاش کنید.",
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/auth/login", loginLimiter);
}

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session(sessionConfig));

// Static files (uploads) - with CORS headers and aggressive caching
app.use(
  "/uploads",
  (req, res, next) => {
    // Set CORS headers for static files
    const origin = req.headers.origin;
    if (!origin || allowedOrigins.includes(origin)) {
      if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      } else {
        // Allow all origins for direct file access (no origin header)
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    }
    // Aggressive caching with stale-while-revalidate for better performance
    res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400"); // 7 days, 1 day grace
    res.setHeader("Vary", "Accept-Encoding");
    next();
  },
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    etag: true,
    lastModified: true
  })
);

// Sitemap route (should be at root level for SEO)
const sitemapController = require("./src/controllers/sitemapController");
const asyncHandler = require("./src/middlewares/asyncHandler");
app.get("/sitemap.xml", asyncHandler(sitemapController.generateSitemap));

// API routes
app.use("/api", routes);

// Swagger setup
const swaggerSetup = require("./swagger-setup");
swaggerSetup(app);

// Combined mode: Serve frontend from dist folder
if (SERVE_MODE === "combined") {
  // ============================================
  // PERFORMANCE: Optimized static file serving
  // ============================================
  
  // Apply performance headers middleware for HTML responses
  app.use(performanceHeaders);
  
  // Serve static files from React app (dist folder) with aggressive caching
  app.use(express.static(path.join(__dirname, "dist"), {
    maxAge: "1y", // Cache assets for 1 year (they have hash in filename)
    etag: true,
    lastModified: true,
    immutable: true, // Assets with hash are immutable
    setHeaders: (res, filePath) => {
      // index.html - must always be fresh
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        return;
      }
      
      // JS and CSS files with hash - cache forever
      if (filePath.match(/\.(js|css)$/) && filePath.includes('.')) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return;
      }
      
      // Fonts - cache for long time
      if (filePath.match(/\.(woff|woff2|ttf|eot|otf)$/)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return;
      }
      
      // Images - aggressive caching with modern format hints
      if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|avif)$/)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        // Add Vary header for content negotiation
        res.setHeader("Vary", "Accept");
        return;
      }
    }
  }));

  // Serve React app for all non-API routes (for client-side routing)
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }
    // Send index.html with no-cache headers
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
} else {
  // Backend mode: API only with root endpoint info
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Dental Appointment System API",
      version: "1.0.0",
      mode: "backend",
      endpoints: {
        health: "/api/health",
        auth: "/api/auth",
        clinics: "/api/clinics",
        doctors: "/api/doctors",
        articles: "/api/articles",
        services: "/api/services",
        comments: "/api/comments",
        swagger: "/api-docs",
      },
    });
  });

  // 404 handler for backend mode
  app.use(notFound);
}

// 404 handler for combined mode (after React catch-all)
if (SERVE_MODE === "combined") {
  app.use(notFound);
}

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🎯 Serve Mode: ${SERVE_MODE === "combined" ? "Combined (Frontend + Backend)" : "Backend Only"}`);
  console.log(`🔗 http://localhost:${PORT}`);

  // Setup cleanup job for expired OTPs
  setupCleanupJob();
  
  // Setup reminder job for appointment reminders
  setupReminderJob();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
