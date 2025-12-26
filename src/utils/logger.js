const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (more readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      msg += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      msg += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return msg;
  })
);

// Define readable file format (for easier debugging)
const readableFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
      msg += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0 && Object.keys(meta).some(key => key !== 'service')) {
      const metaFiltered = { ...meta };
      delete metaFiltered.service;
      if (Object.keys(metaFiltered).length > 0) {
        msg += `\n${JSON.stringify(metaFiltered, null, 2)}`;
      }
    }
    return msg;
  })
);

// Create logger instance
const isProduction = process.env.NODE_ENV === 'production';
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { service: 'dental-appointment-api' },
  transports: [
    // Write all logs to combined.log (readable format)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: readableFormat
    }),
    // Write errors to error.log (readable format)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: readableFormat
    })
  ],
  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: readableFormat
    })
  ],
  // Handle rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: readableFormat
    })
  ]
});

// Add console transport
if (!isProduction) {
  // Development: colored, readable format
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
} else {
  // Production: JSON format for log aggregation tools
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));
}

// Helper methods for better logging
logger.logRequest = (req, res, responseTime) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`
  });
};

logger.logError = (err, req = null) => {
  const errorInfo = {
    message: err.message || 'Unknown error',
    stack: err.stack,
    name: err.name || 'Error',
    code: err.code,
    statusCode: err.statusCode,
    // Include all error properties
    ...(err.meta && { meta: err.meta }),
    ...(err.cause && { cause: err.cause })
  };

  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
      headers: {
        'user-agent': req.get('user-agent'),
        'content-type': req.get('content-type'),
        'authorization': req.get('authorization') ? '[REDACTED]' : undefined
      },
      // Only log body/query/params if they exist and are not too large
      ...(req.body && Object.keys(req.body).length > 0 && Object.keys(req.body).length < 50 && { body: req.body }),
      ...(req.query && Object.keys(req.query).length > 0 && { query: req.query }),
      ...(req.params && Object.keys(req.params).length > 0 && { params: req.params })
    };
  }

  // Always log errors, even if they seem minor
  logger.error('Application Error', errorInfo);
  
  // Also log to console in development for immediate visibility
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', errorInfo);
  }
};

module.exports = logger;

