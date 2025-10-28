# مقایسه CSRF Protection - قدیمی vs جدید

## 🔄 جدول مقایسه سریع

| ویژگی | ❌ CSRF قدیمی (`csurf`) | ✅ CSRF جدید (سفارشی) |
|------|------------------------|---------------------|
| **وضعیت** | Deprecated شده ❌ | فعال و نگهداری می‌شود ✅ |
| **پکیج موردنیاز** | بله (`npm install csurf`) | خیر (built-in) ✅ |
| **سازگاری** | محدود با برخی middleware | سازگار با همه ✅ |
| **سفارشی‌سازی** | دشوار | آسان ✅ |
| **Performance** | متوسط | بهتر ✅ |
| **Cookie** | نیاز به cookie اضافی | استفاده از session موجود ✅ |
| **Maintenance** | متوقف شده | تحت کنترل شما ✅ |
| **کد Source** | نه | بله ✅ |
| **به‌روزرسانی** | امکان ندارد | همیشه ✅ |

---

## 📝 توضیحات تفصیلی

### 1. وضعیت پروژه

#### CSRF قدیمی (`csurf`)
```bash
npm WARN deprecated csurf@1.11.0: 
This package is archived and no longer maintained
```
- ❌ پکیج دیگر پشتیبانی نمی‌شود
- ❌ ممکن است در آینده خراب شود
- ❌ امنیت به‌روزرسانی نمی‌شود

#### CSRF جدید (سفارشی)
```javascript
// src/middlewares/csrf.js
// کد شما - تحت کنترل کامل
```
- ✅ کد شماست
- ✅ همیشه به‌روزرسانی می‌شود
- ✅ امنیت تحت کنترل شما

---

### 2. نحوه استفاده

#### CSRF قدیمی:
```javascript
// Backend
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Frontend - باید cookie را چک کنید
document.cookie  // جستجو در cookie برای token
```

#### CSRF جدید:
```javascript
// Backend
app.use(generateCsrfToken);
app.use(validateCsrfToken);

// Frontend - ساده‌تر
const { data } = await fetch('/api/csrf-token');
const token = data.csrfToken;
```

---

### 3. خطاها و Debugging

#### CSRF قدیمی:
```
Error: Forbidden (403)
Invalid CSRF token
```
- ❌ پیام خطای نامشخص
- ❌ Debugging سخت
- ❌ نمی‌دانید چرا token اشتباه است

#### CSRF جدید:
```javascript
{
  success: false,
  message: 'CSRF token validation failed. Please refresh the page.'
}
```
- ✅ پیام خطای واضح
- ✅ راهنمایی کاربر
- ✅ Easy to debug

---

### 4. سفارشی‌سازی

#### CSRF قدیمی:
```javascript
const csrfProtection = csrf({ 
  cookie: true 
});  // فقط این!
```
- ❌ محدود به گزینه‌های از پیش تعریف شده
- ❌ نمی‌توانید رفتار را تغییر دهید

#### CSRF جدید:
```javascript
const validateCsrfToken = (req, res, next) => {
  // شما کل کنترل دارید!
  if (req.path.includes('/public-endpoint')) {
    return next(); // استثنا کردن endpoint
  }
  
  if (req.method === 'GET') {
    return next(); // skip برای GET
  }
  
  // validation logic
};
```
- ✅ کامل کنترل دارید
- ✅ می‌توانید استثنا کنید
- ✅ انعطاف کامل

---

### 5. Performance

#### CSRF قدیمی:
```
Overhead: 
- Cookie parsing
- Token lookup در هر request
- Validation logic داخلی
```

#### CSRF جدید:
```
Overhead: 
- فقط token lookup در session
- بدون dependency اضافی
- Lightweight و سریع
```

---

## 🎯 کدام بهتر است؟

### ✅ **CSRF جدید (سفارشی) برنده است**

#### دلایل:
1. **Deprecated نیست**: پکیج قدیمی دیگر توسعه داده نمی‌شود
2. **کد شماست**: 100% کنترل دارید
3. **Flexible**: قابل تنظیم کاملاً
4. **SIMPLE**: استفاده ساده‌تر
5. **Modern**: با بهترین practices

---

## 💡 توصیه

### آیا باید از CSRF قدیمی استفاده کنید؟
❌ **خیر** - چون deprecated شده

### آیا باید از CSRF جدید استفاده کنید؟
✅ **بله** - بهتر، ساده‌تر و قابل اعتمادتر است

---

## 📚 یادگیری بیشتر

برای راهنمای کامل استفاده، فایل زیر را بخوانید:
- [`CSRF_SECURITY_GUIDE.md`](./CSRF_SECURITY_GUIDE.md)

---

## خلاصه نهایی

| سوال | جواب |
|------|------|
| کدام بهتر است؟ | ✅ **CSRF جدید (سفارشی)** |
| چرا؟ | Deprecated نیست، کنترل کامل، انعطاف‌پذیر |
| آیا باید تغییر دهم؟ | اگر از پکیج قدیمی استفاده می‌کنید: **بله** ✅ |
| چقدر سخت است؟ | خیلی آسان - فقط token را در header اضافه کنید |

**🎉 نتیجه:** سیستم فعلی (CSRF سفارشی) بهتر و امن‌تر است!

