/**
 * سرویس ارسال پیام از طریق API ایتا
 * مستندات: https://eitaayar.ir
 */

const axios = require("axios");

class EitaaService {
  constructor() {
    this.baseUrl = "https://eitaayar.ir/api";
  }

  /**
   * ارسال پیام متنی
   * @param {string} token - توکن API ایتا
   * @param {string} chatId - شناسه کانال/گروه
   * @param {string} text - متن پیام
   * @param {object} options - گزینه‌های اضافی
   * @returns {Promise<object>}
   */
  async sendMessage(token, chatId, text, options = {}) {
    try {
      const url = `${this.baseUrl}/${token}/sendMessage`;

      const params = {
        chat_id: chatId,
        text: text,
        ...options,
      };

      const response = await axios.post(url, params, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.data.ok) {
        return {
          success: true,
          messageId: response.data.result?.message_id,
          data: response.data.result,
        };
      } else {
        return {
          success: false,
          error: response.data.description || "خطا در ارسال پیام",
        };
      }
    } catch (error) {
      console.error("Eitaa API Error:", error.message);
      return {
        success: false,
        error: error.response?.data?.description || error.message || "خطا در ارتباط با API ایتا",
      };
    }
  }

  /**
   * ارسال پیام با دکمه‌های inline
   * @param {string} token - توکن API ایتا
   * @param {string} chatId - شناسه کانال/گروه
   * @param {string} text - متن پیام
   * @param {array} buttons - آرایه دکمه‌ها: [{text: "تایید", callback_data: "approve_123"}]
   * @param {object} options - گزینه‌های اضافی
   * @returns {Promise<object>}
   */
  async sendMessageWithButtons(token, chatId, text, buttons, options = {}) {
    // ایتا از inline keyboard پشتیبانی می‌کنه ولی باید به صورت خاص فرمت بشه
    // برای الان فقط متن رو می‌فرستیم و دکمه‌ها رو در متن می‌ذاریم
    // یا می‌تونیم از reply_markup استفاده کنیم اگه API پشتیبانی کنه
    
    // برای سادگی، دکمه‌ها رو به صورت متن در انتهای پیام اضافه می‌کنیم
    let messageText = text;
    
    if (buttons && buttons.length > 0) {
      messageText += "\n\n";
      buttons.forEach((btn, index) => {
        messageText += `${index + 1}. ${btn.text}\n`;
      });
    }

    return this.sendMessage(token, chatId, messageText, options);
  }

  /**
   * دریافت اطلاعات API
   * @param {string} token - توکن API ایتا
   * @returns {Promise<object>}
   */
  async getMe(token) {
    try {
      const url = `${this.baseUrl}/${token}/getMe`;

      const response = await axios.get(url, {
        timeout: 10000,
      });

      if (response.data.ok) {
        return {
          success: true,
          data: response.data.result,
        };
      } else {
        return {
          success: false,
          error: response.data.description || "خطا در دریافت اطلاعات",
        };
      }
    } catch (error) {
      console.error("Eitaa API Error:", error.message);
      return {
        success: false,
        error: error.response?.data?.description || error.message || "خطا در ارتباط با API ایتا",
      };
    }
  }

  /**
   * ارسال فایل/مدیا
   * @param {string} token - توکن API ایتا
   * @param {string} chatId - شناسه کانال/گروه
   * @param {Buffer|string} file - فایل (Buffer یا path)
   * @param {string} caption - توضیحات فایل
   * @param {object} options - گزینه‌های اضافی
   * @returns {Promise<object>}
   */
  async sendDocument(token, chatId, file, caption = "", options = {}) {
    try {
      const FormData = require("form-data");
      const form = new FormData();

      form.append("chat_id", chatId);
      if (caption) {
        form.append("caption", caption);
      }
      
      // اگر file یک path است
      if (typeof file === "string") {
        const fs = require("fs");
        form.append("file", fs.createReadStream(file));
      } else {
        // اگر Buffer است
        form.append("file", file);
      }

      // اضافه کردن گزینه‌های اضافی
      Object.keys(options).forEach((key) => {
        form.append(key, options[key]);
      });

      const url = `${this.baseUrl}/${token}/sendDocument`;

      const response = await axios.post(url, form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });

      if (response.data.ok) {
        return {
          success: true,
          messageId: response.data.result?.message_id,
          data: response.data.result,
        };
      } else {
        return {
          success: false,
          error: response.data.description || "خطا در ارسال فایل",
        };
      }
    } catch (error) {
      console.error("Eitaa API Error:", error.message);
      return {
        success: false,
        error: error.response?.data?.description || error.message || "خطا در ارتباط با API ایتا",
      };
    }
  }

  /**
   * ویرایش پیام موجود
   * @param {string} token - توکن API ایتا
   * @param {string} chatId - شناسه کانال/گروه
   * @param {string|number} messageId - شناسه پیام
   * @param {string} text - متن جدید پیام
   * @param {object} options - گزینه‌های اضافی
   * @returns {Promise<object>}
   */
  async editMessage(token, chatId, messageId, text, options = {}) {
    try {
      const url = `${this.baseUrl}/${token}/editMessageText`;

      const params = {
        chat_id: chatId,
        message_id: messageId,
        text: text,
        ...options,
      };

      const response = await axios.post(url, params, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.data.ok) {
        return {
          success: true,
          data: response.data.result,
        };
      } else {
        return {
          success: false,
          error: response.data.description || "خطا در ویرایش پیام",
        };
      }
    } catch (error) {
      console.error("Eitaa API Error:", error.message);
      return {
        success: false,
        error: error.response?.data?.description || error.message || "خطا در ارتباط با API ایتا",
      };
    }
  }
}

module.exports = new EitaaService();

