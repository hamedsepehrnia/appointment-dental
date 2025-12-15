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
    const lines = message.split('\n');
    const maxLineLength = Math.max(...lines.map(l => l.length), 40);
    const boxWidth = Math.min(maxLineLength + 4, 70);
    
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
      bgBlue: '\x1b[44m',
      bgCyan: '\x1b[46m',
    };

    // آیکون بر اساس نوع گیرنده
    const roleIcons = {
      'بیمار': '🧑‍⚕️',
      'منشی': '👩‍💼',
      'مدیر': '👨‍💼',
      'کاربر': '👤',
    };

    const icon = roleIcons[recipientType] || '📱';
    
    console.log('');
    console.log(`${colors.cyan}╭${'─'.repeat(boxWidth)}╮${colors.reset}`);
    console.log(`${colors.cyan}│${colors.reset} ${colors.bright}${colors.yellow}📨 ${smsType}${colors.reset}${' '.repeat(boxWidth - smsType.length - 5)}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}│${colors.reset} ${colors.bright}خطاب به: ${icon} ${phoneNumber} (${recipientType})${colors.reset}${' '.repeat(Math.max(0, boxWidth - 20 - phoneNumber.length - recipientType.length))}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}├${'─'.repeat(boxWidth)}┤${colors.reset}`);
    
    // متن پیام
    for (const line of lines) {
      const paddedLine = line.padEnd(boxWidth - 2);
      const truncatedLine = paddedLine.substring(0, boxWidth - 2);
      console.log(`${colors.cyan}│${colors.reset} ${colors.white}${truncatedLine}${colors.reset} ${colors.cyan}│${colors.reset}`);
    }
    
    console.log(`${colors.cyan}├${'─'.repeat(boxWidth)}┤${colors.reset}`);
    console.log(`${colors.cyan}│${colors.reset} ${colors.green}⏰ ${time}${colors.reset}${' '.repeat(Math.max(0, boxWidth - time.length - 5))}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}│${colors.reset} ${colors.magenta}📵 حالت لاگ (ارسال نشد)${colors.reset}${' '.repeat(Math.max(0, boxWidth - 26))}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}╰${'─'.repeat(boxWidth)}╯${colors.reset}`);
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
