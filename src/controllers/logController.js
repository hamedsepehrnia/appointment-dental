const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Get recent logs (Admin only)
 * @route GET /api/logs
 */
const getLogs = async (req, res) => {
  const { type = 'error', lines = 100 } = req.query;
  const logsDir = path.join(__dirname, '../../logs');
  
  let logFile;
  switch (type) {
    case 'error':
      logFile = path.join(logsDir, 'error.log');
      break;
    case 'combined':
      logFile = path.join(logsDir, 'combined.log');
      break;
    case 'exceptions':
      logFile = path.join(logsDir, 'exceptions.log');
      break;
    case 'rejections':
      logFile = path.join(logsDir, 'rejections.log');
      break;
    default:
      throw new AppError('نوع لاگ نامعتبر است', 400);
  }

  try {
    // Check if file exists
    try {
      await fs.access(logFile);
    } catch {
      return res.json({
        success: true,
        data: {
          logs: [],
          message: 'فایل لاگ هنوز ایجاد نشده است'
        }
      });
    }

    // Read file
    const content = await fs.readFile(logFile, 'utf-8');
    const allLines = content.split('\n').filter(line => line.trim());
    
    // Get last N lines
    const recentLines = allLines.slice(-parseInt(lines));
    
    res.json({
      success: true,
      data: {
        type,
        totalLines: allLines.length,
        showingLines: recentLines.length,
        logs: recentLines
      }
    });
  } catch (error) {
    throw new AppError(`خطا در خواندن فایل لاگ: ${error.message}`, 500);
  }
};

/**
 * Get log file info
 * @route GET /api/logs/info
 */
const getLogInfo = async (req, res) => {
  const logsDir = path.join(__dirname, '../../logs');
  const logFiles = ['error.log', 'combined.log', 'exceptions.log', 'rejections.log'];
  
  const info = {};
  
  for (const file of logFiles) {
    const filePath = path.join(logsDir, file);
    try {
      const stats = await fs.stat(filePath);
      info[file] = {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`
      };
    } catch {
      info[file] = {
        exists: false
      };
    }
  }
  
  res.json({
    success: true,
    data: info
  });
};

module.exports = {
  getLogs,
  getLogInfo
};

