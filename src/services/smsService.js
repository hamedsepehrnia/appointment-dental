const axios = require('axios');

class SmsService {
  constructor() {
    this.apiKey = process.env.KAVENEGAR_API_KEY;
    this.sender = process.env.KAVENEGAR_SENDER;
    this.baseUrl = `https://api.kavenegar.com/v1/${this.apiKey}`;
    // Check if SMS should be logged instead of sent
    this.logOnly = process.env.SMS_LOG_ONLY === 'true' || process.env.SMS_LOG_ONLY === '1';
  }

  /**
   * رسم باکس پیام در ترمینال
   * @param {string} phoneNumber - شماره گیرنده
   * @param {string} message - متن پیام
   * @param {string} recipientType - نوع گیرنده (بیمار، منشی، مدیر)
   * @param {string} smsType - نوع پیامک (OTP، نوبت، یادآوری و...)
   */
  logSmsBox(phoneNumber, message, recipientType = 'کاربر', smsType = 'پیامک') {
    const time = new Date().toLocaleString('fa-IR');
    
    // رنگ‌ها برای ترمینال
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      cyan: '\x1b[36m',
      yellow: '\x1b[33m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      white: '\x1b[37m',
    };

    // آیکون بر اساس نوع گیرنده
    const roleIcons = {
      'بیمار': '🧑‍⚕️',
      'منشی': '👩‍💼',
      'مدیر': '👨‍💼',
      'کاربر': '👤',
      'کاربر جدید': '🆕',
    };

    const icon = roleIcons[recipientType] || '📱';
    const separator = '═'.repeat(60);
    const thinSeparator = '─'.repeat(60);
    
    console.log('');
    console.log(`${colors.cyan}╔${separator}╗${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.bright}${colors.yellow}📨 ${smsType}${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.bright}خطاب به: ${icon} ${phoneNumber} (${recipientType})${colors.reset}`);
    console.log(`${colors.cyan}╠${separator}╣${colors.reset}`);
    
    // متن پیام - هر خط جداگانه
    const lines = message.split('\n');
    for (const line of lines) {
      if (line.trim() === '') {
        console.log(`${colors.cyan}║${colors.reset}`);
      } else {
        console.log(`${colors.cyan}║${colors.reset} ${colors.white}${line}${colors.reset}`);
      }
    }
    
    console.log(`${colors.cyan}╠${separator}╣${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}⏰ ${time}${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.magenta}📵 حالت لاگ (ارسال نشد)${colors.reset}`);
    console.log(`${colors.cyan}╚${separator}╝${colors.reset}`);
    console.log('');
  }

  /**
   * Send OTP code via SMS using Kavenegar template
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} code - OTP code
   * @param {string} recipientType - نوع گیرنده
   * @returns {Promise<Object>} - API response
   */
  async sendOtp(phoneNumber, code, recipientType = 'کاربر') {
    // If SMS_LOG_ONLY is enabled, log instead of sending
    if (this.logOnly) {
      const message = `کد تأیید شما: ${code}\nاین کد تا ۵ دقیقه معتبر است.`;
      this.logSmsBox(phoneNumber, message, recipientType, 'کد تأیید OTP');
      
      return {
        success: true,
        data: { message: 'SMS logged instead of sent (SMS_LOG_ONLY enabled)' },
      };
    }

    try {
      const template = process.env.OTP_TEMPLATE || 'verify';
      const url = `${this.baseUrl}/verify/lookup.json`;
      
      const response = await axios.post(url, null, {
        params: {
          receptor: phoneNumber,
          token: code,
          template,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('SMS sending error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.return?.message || error.message,
      };
    }
  }

  /**
   * Send simple SMS (for non-OTP messages)
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - Message content
   * @param {string} recipientType - نوع گیرنده (بیمار، منشی، مدیر)
   * @param {string} smsType - نوع پیامک
   * @returns {Promise<Object>} - API response
   */
  async sendSimpleSms(phoneNumber, message, recipientType = 'کاربر', smsType = 'پیامک') {
    // If SMS_LOG_ONLY is enabled, log instead of sending
    if (this.logOnly) {
      this.logSmsBox(phoneNumber, message, recipientType, smsType);
      
      return {
        success: true,
        data: { message: 'SMS logged instead of sent (SMS_LOG_ONLY enabled)' },
      };
    }

    try {
      const url = `${this.baseUrl}/sms/send.json`;
      
      const response = await axios.post(url, null, {
        params: {
          sender: this.sender,
          receptor: phoneNumber,
          message,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('SMS sending error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.return?.message || error.message,
      };
    }
  }
}

module.exports = new SmsService();
