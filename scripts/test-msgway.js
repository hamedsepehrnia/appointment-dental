require('dotenv').config();
// Force log-only mode for safe testing
process.env.SMS_LOG_ONLY = 'true';

const sms = require('../src/services/smsService');

(async () => {
  try {
    const phone = process.env.TEST_SMS_NUMBER || '09123456789';
    const code = '1234';
    const templateID = process.env.MSGWAY_TEMPLATE_ID || 12;

    const res = await sms.sendOtp(phone, code, { templateID, params: ['تست'] });
    console.log('Test result:', res);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
})();
