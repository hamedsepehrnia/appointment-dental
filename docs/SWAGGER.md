# راهنمای Swagger Documentation

فایل `swagger.json` با OpenAPI 3.0 برای مستندسازی کامل API سیستم مدیریت نوبت‌دهی کلینیک دندانپزشکی ایجاد شده است.

## 📦 نصب وابستگی‌ها

برای استفاده از Swagger UI، ابتدا وابستگی‌های لازم را نصب کنید:

```bash
npm install swagger-ui-express swagger-jsdoc
```

## 🚀 راه‌اندازی

### روش 1: استفاده از فایل `swagger-setup.js` (توصیه شده)

در فایل `server.js` خود، خط زیر را اضافه کنید:

```javascript
// در قسمت بالای فایل
const swaggerSetup = require('./swagger-setup');

// بعد از app.use('/api', routes);
swaggerSetup(app);
```

### روش 2: استفاده مستقیم

در فایل `server.js` خود، خطوط زیر را اضافه کنید:

```javascript
// در قسمت بالای فایل
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// بعد از app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Documentation - سیستم مدیریت نوبت‌دهی کلینیک دندانپزشکی',
}));
```

## 📚 دسترسی به مستندات

پس از راه‌اندازی سرور، به آدرس زیر بروید:

```
http://localhost:4000/api-docs
```

یا

```
http://localhost:3000/api-docs
```

(بسته به پورت سرور شما)

## ✨ ویژگی‌های فایل Swagger

### 1. **مستندسازی کامل**
- تمامی endpoint های API
- پارامترهای ورودی و خروجی
- انواع داده‌ها و validation قوانین
- مثال‌های کاربردی

### 2. **احراز هویت**
- مستندات کامل سیستم Session-based authentication
- توضیحات برای هر نقش کاربری (Admin, Secretary, Patient)
- روش‌های مختلف ورود (رمز عبور و OTP)

### 3. **Tags سازمان‌یافته**
- Authentication
- Clinics
- Doctors
- Articles
- Services
- Comments
- FAQs
- Gallery
- Settings
- Insurance
- Health

### 4. **Responses کامل**
- 200: موفق
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found

### 5. **Schemas تعریف شده**
- User
- Clinic
- Doctor
- Article
- Service
- Comment
- FAQ
- Gallery
- Settings
- InsuranceOrganization
- Pagination
- Error

## 🧪 تست کردن API

با استفاده از Swagger UI می‌توانید:

1. **بررسی مستندات**: تمامی endpoint ها با جزئیات کامل
2. **آزمایش API**: بدون نیاز به Postman یا ابزار دیگر
3. **نمایش Schema ها**: ساختار داده‌ها
4. **دریافت و ارسال درخواست**: مستقیماً از مرورگر

## 📝 مثال استفاده

### ورود با رمز عبور
```javascript
POST /api/auth/login
{
  "phoneNumber": "09123456789",
  "password": "password123"
}
```

### دریافت لیست کلینیک‌ها
```javascript
GET /api/clinics?page=1&limit=10
```

### ایجاد پزشک (با فایل)
```javascript
POST /api/doctors
Content-Type: multipart/form-data

{
  "firstName": "دکتر احمد",
  "lastName": "احمدی",
  "university": "تهران",
  "medicalLicenseNo": "12345",
  "profileImage": <file>
}
```

## 🔄 به‌روزرسانی فایل Swagger

برای به‌روزرسانی فایل `swagger.json`:

1. فایل `swagger.json` را باز کنید
2. تغییرات مورد نظر را اعمال کنید
3. از سایت [Swagger Editor](https://editor.swagger.io/) برای اعتبارسنجی استفاده کنید

## 🎨 سفارشی‌سازی UI

در فایل `swagger-setup.js` می‌توانید تغییرات مورد نظر را اعمال کنید:

```javascript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',  // تغییر CSS
  customSiteTitle: 'عنوان خود',                           // تغییر عنوان
  customfavIcon: '/favicon.ico',                        // تغییر آیکون
}));
```

## 📖 منابع بیشتر

- [Swagger Documentation](https://swagger.io/docs/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)

## ⚠️ نکات مهم

1. **احراز هویت**: برای دسترسی به endpoint های محافظت‌شده، ابتدا باید ورود کنید و cookie را فعال کنید
2. **CORS**: مطمئن شوید که CORS در تنظیمات سرور فعال است
3. **Rate Limiting**: برخی endpoint ها محدودیت در تعداد درخواست دارند
4. **Multipart/form-data**: برای آپلود فایل، از نوع `multipart/form-data` استفاده کنید

## 🐛 رفع مشکلات

### Swagger UI نمایش داده نمی‌شود
- مطمئن شوید که وابستگی‌ها نصب شده‌اند
- مسیر `/api-docs` را بررسی کنید
- فایل `swagger.json` را بررسی کنید (معتبر باشد)

### خطای 404
- پورت سرور را بررسی کنید
- مسیر routes را بررسی کنید

### خطای JSON
- فایل `swagger.json` را از [Swagger Editor](https://editor.swagger.io/) بررسی کنید

