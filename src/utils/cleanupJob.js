const prisma = require('../config/database');

/**
 * Cleanup job to remove expired OTP codes from database
 * This should be run periodically (e.g., every hour) to prevent database bloat
 */
const cleanupExpiredOtps = async () => {
  try {
    const result = await prisma.otpCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } }, // Expired OTPs
          { 
            verified: true, // Already verified OTPs older than 24 hours
            createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          },
        ],
      },
    });

    if (result.count > 0) {
      console.log(`✓ Cleaned up ${result.count} expired/verified OTP code(s)`);
    }

    return result;
  } catch (error) {
    console.error('✗ Error cleaning up OTP codes:', error);
    throw error;
  }
};

/**
 * Setup cleanup job to run automatically
 * @param {number} intervalMs - Interval in milliseconds (default: 1 hour)
 */
const setupCleanupJob = (intervalMs = 60 * 60 * 1000) => {
  // Run immediately on startup
  cleanupExpiredOtps().catch(console.error);

  // Then run at intervals
  setInterval(() => {
    cleanupExpiredOtps().catch(console.error);
  }, intervalMs);

  console.log('✓ OTP cleanup job scheduled');
};

module.exports = {
  cleanupExpiredOtps,
  setupCleanupJob,
};

