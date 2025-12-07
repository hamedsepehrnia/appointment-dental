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

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with enhanced configuration
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: [
                "'self'",
                "data:",
                "https:",
                "http://localhost:4000",
                "http://localhost:5173",
              ],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
            },
          }
        : false, // Disable CSP in development for easier debugging
    hsts:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false, // Disable HSTS in development
    crossOriginEmbedderPolicy: false, // For compatibility with some APIs
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
  })
);

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

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Session
app.use(session(sessionConfig));

// Static files (uploads) - with CORS headers and caching
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
    // Cache uploads for 1 day
    res.setHeader("Cache-Control", "public, max-age=86400");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// API routes
app.use("/api", routes);

// Swagger setup
const swaggerSetup = require("./swagger-setup");
swaggerSetup(app);

// Serve static files from React app (dist folder) with caching
app.use(express.static(path.join(__dirname, "dist"), {
  maxAge: "1y", // Cache assets for 1 year (they have hash in filename)
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Don't cache index.html (so updates are reflected immediately)
    if (filePath.endsWith("index.html")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
  }
}));

// Serve React app for all non-API routes (for client-side routing)
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ success: false, message: "Route not found" });
  }
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 http://localhost:${PORT}`);

  // Setup cleanup job for expired OTPs
  setupCleanupJob();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
  });
});
