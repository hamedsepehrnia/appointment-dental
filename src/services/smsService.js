const axios = require('axios');

// Try to load official client if installed
let MessageWayModule = null;
try {
  MessageWayModule = require('messageway');
} catch (e) {
  MessageWayModule = null;
}

const MessageWay = MessageWayModule ? MessageWayModule.MessageWay : null;

class SmsService {
  constructor() {
    this.apiKey = process.env.MSGWAY_API_KEY;
    this.client = MessageWay && this.apiKey ? new MessageWay(this.apiKey) : null;
    this.baseUrl = 'https://api.msgway.com/send';
    this.logOnly = process.env.SMS_LOG_ONLY === 'true';
    this.maxParamLength = 40;
    this.maxParams = 10;
  }

  /**
   * Validate and sanitize params array
   * @param {string[]} params
   * @returns {string[]} sanitized params
   */
  sanitizeParams(params) {
    if (!Array.isArray(params)) return [];
    
    return params
      .slice(0, this.maxParams) // حداکثر ۱۰ پارامتر
      .map(param => {
        const strParam = String(param);
        // اطمینان از عدم وجود URL در پارامترها
        if (strParam.includes('http://') || strParam.includes('https://')) {
          console.warn('URL found in params, removing for security');
          return strParam.replace(/https?:\/\/[^\s]+/g, '[URL_REMOVED]');
        }
        return strParam.substring(0, this.maxParamLength); // حداکثر ۴۰ کاراکتر
      });
  }

  /**
   * Log SMS content in development
   */
  logSms(phoneNumber, templateID, params, type = 'SMS') {
    const time = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });
    console.log(`
╔══════════════════════════════════════════════╗
║ ${type} | ${phoneNumber}
║ Template: ${templateID}
║ Params: ${JSON.stringify(params)}
║ ${time}
╚══════════════════════════════════════════════╝
    `);
  }

  /**
   * Build request payload based on MsgWay API specs
   */
  buildPayload(mobile, templateID, options = {}) {
    const {
      params = [],
      code,
      length,
      provider,
      expireTime,
      hash,
      method = 'sms',
      countryCode
    } = options;

    const payload = {
      mobile: String(mobile),
      method,
      templateID: parseInt(templateID, 10)
    };

    // فقط پارامترهای معتبر رو اضافه کن
    const sanitizedParams = this.sanitizeParams(params);
    if (sanitizedParams.length > 0) {
      payload.params = sanitizedParams;
    }

    // OTP related fields
    if (code !== undefined && code !== null) {
      const codeStr = String(code);
      if (/^\d{3,12}$/.test(codeStr)) {
        payload.code = codeStr;
      }
    }
    
    if (length && !code) {
      payload.length = parseInt(length, 10);
    }
    
    if (expireTime) {
      payload.expireTime = parseInt(expireTime, 10);
    }

    // Optional fields
    if (hash && /^[a-zA-Z0-9#]+$/.test(hash)) {
      payload.hash = hash;
    }
    
    if (provider && [1, 2, 3, 5, 8, 9, 10, 12].includes(parseInt(provider))) {
      payload.provider = parseInt(provider);
    }
    
    if (countryCode) {
      payload.countryCode = parseInt(countryCode);
    }

    return payload;
  }

  /**
   * ارسال پیامک با قالب مشخص
   * @param {string} mobile - شماره موبایل
   * @param {number|string} templateID - شناسه قالب
   * @param {Object} options - پارامترهای اضافی
   * @returns {Promise<{success: boolean, data?: any, error?: any}>}
   */
  async sendTemplatedSms(mobile, templateID, options = {}) {
    // اعتبارسنجی اولیه
    if (!mobile || !templateID) {
      return { 
        success: false, 
        error: 'شماره موبایل و شناسه قالب الزامی است' 
      };
    }

    if (!this.apiKey && !this.logOnly) {
      return { 
        success: false, 
        error: 'API Key تنظیم نشده است' 
      };
    }

    // لاگ در حالت توسعه
    if (this.logOnly) {
      this.logSms(mobile, templateID, options.params || []);
      return { 
        success: true, 
        data: { 
          status: 'logged', 
          message: 'پیامک فقط لاگ شد (SMS_LOG_ONLY=true)' 
        } 
      };
    }

    try {
      const payload = this.buildPayload(mobile, templateID, options);

      // استفاده از کتابخانه رسمی در صورت وجود
      if (this.client) {
        const result = await this.client.sendSMS(payload);
        return { success: true, data: result };
      }

      // درخواست مستقیم به API
      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          apiKey: this.apiKey,
          'accept-language': process.env.MSGWAY_ACCEPT_LANGUAGE || 'fa',
          'Content-Type': 'application/json'
        },
        timeout: 10000 // ۱۰ ثانیه timeout
      });

      if (response.data?.status === 'success') {
        return { success: true, data: response.data };
      } else {
        return { 
          success: false, 
          error: response.data?.error?.message || 'خطای نامشخص از سرویس پیامک' 
        };
      }
    } catch (error) {
      // مدیریت خطا با جزئیات بیشتر
      let errorMessage = 'خطا در ارسال پیامک';
      
      if (error.response) {
        // خطای سرور با response
        errorMessage = error.response.data?.error?.message || 
                      `خطای HTTP ${error.response.status}`;
        console.error('MsgWay API Error:', error.response.data);
      } else if (error.request) {
        // عدم دریافت response
        errorMessage = 'عدم اتصال به سرویس پیامک';
        console.error('MsgWay Connection Error:', error.message);
      } else {
        console.error('MsgWay Error:', error.message);
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * ارسال کد تأیید (OTP)
   * @param {string} mobile - شماره موبایل
   * @param {string} code - کد تأیید
   * @param {number|Object} templateOrOptions - شناسه قالب یا options
   * @returns {Promise<Object>}
   */
  async sendOtp(mobile, code, templateOrOptions = {}) {
    let templateID;
    let options = {};

    // پردازش ورودی‌های مختلف
    if (typeof templateOrOptions === 'number' || typeof templateOrOptions === 'string') {
      templateID = templateOrOptions;
    } else if (typeof templateOrOptions === 'object') {
      templateID = templateOrOptions.templateID || templateOrOptions.tpl;
      options = { ...templateOrOptions };
    }

    // استفاده از template پیش‌فرض
    if (!templateID) {
      templateID = process.env.MSGWAY_OTP_TEMPLATE_ID || process.env.MSGWAY_TEMPLATE_ID;
    }

    if (!templateID) {
      return { 
        success: false, 
        error: 'شناسه قالب OTP مشخص نشده است' 
      };
    }

    // تنظیمات OTP
    const otpOptions = {
      ...options,
      code,
      length: options.length || String(code).length,
      expireTime: options.expireTime || process.env.OTP_EXPIRE_SECONDS || 300
    };

    return this.sendTemplatedSms(mobile, templateID, otpOptions);
  }

  /**
   * ارسال پیامک ساده (با استفاده از قالب پیش‌فرض)
   * @deprecated استفاده از sendTemplatedSms توصیه می‌شود
   */
  async sendSimpleSms(mobile, params, templateID = null, recipientType = 'کاربر') {
    const finalTemplateID = templateID || 
                           process.env.MSGWAY_SIMPLE_SMS_TEMPLATE_ID || 
                           process.env.MSGWAY_TEMPLATE_ID;

    if (!finalTemplateID) {
      return { 
        success: false, 
        error: 'شناسه قالب برای پیامک ساده مشخص نشده است' 
      };
    }

    return this.sendTemplatedSms(mobile, finalTemplateID, {
      params: Array.isArray(params) ? params : [params]
    });
  }
}

module.exports = new SmsService();