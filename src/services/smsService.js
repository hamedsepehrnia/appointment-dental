const axios = require('axios');

class SmsService {
  constructor() {
    this.apiKey = process.env.KAVENEGAR_API_KEY;
    this.sender = process.env.KAVENEGAR_SENDER;
    this.baseUrl = `https://api.kavenegar.com/v1/${this.apiKey}`;
  }

  /**
   * Send OTP code via SMS using Kavenegar template
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} code - OTP code
   * @returns {Promise<Object>} - API response
   */
  async sendOtp(phoneNumber, code) {
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
   * @returns {Promise<Object>} - API response
   */
  async sendSimpleSms(phoneNumber, message) {
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

