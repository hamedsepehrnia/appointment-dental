# سیستم مدیریت نوبت‌دهی کلینیک دندانپزشکی

یک API کامل و حرفه‌ای برای مدیریت نوبت‌دهی کلینیک دندانپزشکی با استفاده از Express.js، PostgreSQL و Prisma.

## 📋 فهرست مطالب

- [ویژگی‌ها](#ویژگیها)
- [تکنولوژی‌های استفاده شده](#تکنولوژیهای-استفاده-شده)
- [پیش‌نیازها](#پیشنیازها)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [ساختار پروژه](#ساختار-پروژه)
- [API Documentation](#api-documentation)
- [احراز هویت](#احراز-هویت)
- [نقش‌های کاربری](#نقشهای-کاربری)
- [امنیت](#امنیت)

## ✨ ویژگی‌ها

### مدیریت کاربران
- سیستم احراز هویت با دو روش: رمز عبور (Admin/Secretary) و OTP (همه کاربران)
- سه نقش کاربری: مدیر، منشی، بیمار
- مدیریت پروفایل کاربران
- تنظیمات session با PostgreSQL store

### مدیریت کلینیک‌ها
- ثبت و مدیریت اطلاعات کلینیک‌ها
- اختصاص منشی به هر کلینیک (رابطه Many-to-One)
- مدیریت دسترسی‌های ویرایش توسط منشی

### مدیریت پزشکان
- ثبت اطلاعات کامل پزشکان (نام، دانشگاه، بیوگرافی، مهارت‌ها)
- آپلود تصویر پروفایل
- ارتباط با چندین کلینیک (Many-to-Many)
- جستجو و فیلتر بر اساس کلینیک

### سیستم مقالات
- ایجاد، ویرایش و حذف مقالات
- حالت پیش‌نویس و منتشرشده
- آپلود تصویر کاور
- سیستم slug برای URL‌های SEO-friendly
- جستجو و فیلتر بر اساس وضعیت انتشار

### مدیریت خدمات
- ثبت خدمات دندانپزشکی با تعرفه و مدت زمان
- توصیه‌های قبل و بعد از درمان
- آپلود تصویر کاور
- سیستم slug برای URL‌های SEO-friendly

### سیستم نظرات
- ثبت نظر و امتیاز برای پزشکان، مقالات و خدمات
- محاسبه خودکار میانگین امتیاز
- مدیریت نظرات توسط کاربران (ویرایش/حذف)
- سیستم polymorphic برای پشتیبانی از انواع مختلف کامنت
- نمایش لیست نظرات با pagination

### مدیریت سوالات متداول (FAQ)
- ایجاد و مدیریت FAQ
- ترتیب‌بندی قابل تنظیم
- حالت منتشرشده/پیش‌نویس
- سیستم reorder برای تغییر ترتیب

### مدیریت گالری
- آپلود تصاویر گالری
- مدیریت عنوان، توضیحات و ترتیب
- حالت منتشرشده/پیش‌نویس
- سیستم reorder برای تغییر ترتیب

### مدیریت تنظیمات
- تنظیمات عمومی سایت (نام، لوگو، آدرس، تماس)
- مدیریت لینک‌های شبکه‌های اجتماعی
- تنظیمات ساعات کاری

### مدیریت سازمان‌های بیمه
- ثبت و مدیریت سازمان‌های بیمه تحت پوشش
- امکان فعال/غیرفعال کردن سازمان‌ها
- ترتیب‌بندی سازمان‌ها
- مدیریت کامل اطلاعات (وب‌سایت، تماس، ایمیل)

## 🛠 تکنولوژی‌های استفاده شده

- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Session-based با express-session و connect-pg-simple
- **SMS Service**: کاوه‌نگار (Kavenegar)
- **File Upload**: Multer
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting, CSRF Protection
- **Password Hashing**: bcryptjs
- **Logging**: Winston, Morgan
- **Documentation**: Swagger/OpenAPI
- **HTML Sanitization**: sanitize-html
- **Compression**: express-compression

## 📦 پیش‌نیازها

- Node.js (v16 یا بالاتر)
- PostgreSQL (v13 یا بالاتر)
- npm یا yarn
- API Key کاوه‌نگار (برای ارسال SMS)

## 🚀 نصب و راه‌اندازی

### 1. کلون کردن پروژه

```bash
git clone <repository-url>
cd appointment-dental
```

### 2. نصب وابستگی‌ها

```bash
npm install
```

### 3. تنظیم متغیرهای محیطی

فایل `.env` ایجاد کنید و متغیرهای زیر را تنظیم کنید:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/appointment_dental?schema=public"

# Server
PORT=3000
NODE_ENV=development

# Session
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
SESSION_MAX_AGE=2592000000

# Kavenegar SMS API
KAVENEGAR_API_KEY=your-kavenegar-api-key
KAVENEGAR_SENDER=your-sender-number
OTP_TEMPLATE=verify

# OTP Configuration
OTP_EXPIRY_MINUTES=5

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads
```

### 4. راه‌اندازی دیتابیس

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (اختیاری) باز کردن Prisma Studio
npm run prisma:studio
```

### 5. ایجاد فولدرهای آپلود

```bash
# Linux/Mac
mkdir -p uploads/doctors uploads/gallery uploads/images

# Windows PowerShell
New-Item -ItemType Directory -Force -Path uploads/doctors, uploads/gallery, uploads/images
```

### 6. ایجاد کاربر مدیر

```bash
npm run create:admin
```

### 7. اجرای سرور

```bash
# Development mode
npm run dev

# Production mode
npm start
```

سرور روی `http://localhost:3000` (یا پورت تنظیم شده) اجرا می‌شود.

## 📁 ساختار پروژه

```
appointment-dental/
├── prisma/
│   ├── migrations/          # Prisma migrations
│   └── schema.prisma        # Prisma schema
├── src/
│   ├── cli/
│   │   └── createUser.js    # CLI برای ساخت مدیر/منشی
│   ├── config/
│   │   ├── database.js      # تنظیمات Prisma
│   │   └── session.js        # تنظیمات Session
│   ├── controllers/         # Controllers
│   │   ├── authController.js
│   │   ├── clinicController.js
│   │   ├── doctorController.js
│   │   ├── articleController.js
│   │   ├── serviceController.js
│   │   ├── commentController.js
│   │   ├── faqController.js
│   │   ├── galleryController.js
│   │   ├── settingsController.js
│   │   └── insuranceController.js
│   ├── middlewares/
│   │   ├── auth.js          # Authentication middleware
│   │   ├── csrf.js          # CSRF protection
│   │   ├── errorHandler.js  # Error handling
│   │   ├── validation.js    # Joi validation
│   │   ├── upload.js        # File upload
│   │   ├── parseFormData.js # Form data parser
│   │   └── asyncHandler.js  # Async wrapper
│   ├── routes/              # Route definitions
│   │   ├── authRoutes.js
│   │   ├── clinicRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── articleRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── faqRoutes.js
│   │   ├── galleryRoutes.js
│   │   ├── settingsRoutes.js
│   │   ├── insuranceRoutes.js
│   │   └── index.js
│   ├── services/
│   │   └── smsService.js     # Kavenegar SMS
│   └── utils/
│       ├── helpers.js        # Helper functions
│       ├── sanitizeHtml.js   # HTML sanitization
│       └── cleanupJob.js     # Cleanup expired OTPs
├── uploads/                 # فایل‌های آپلود شده
│   ├── doctors/             # تصاویر پزشکان
│   ├── gallery/             # تصاویر گالری
│   └── images/              # تصاویر مقالات و خدمات
├── logs/                    # فایل‌های لاگ
├── docs/                    # مستندات
├── .env                     # متغیرهای محیطی
├── .gitignore
├── package.json
├── server.js                # Entry point
├── swagger-setup.js         # Swagger configuration
└── README.md
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

**نکته:** در development، پورت پیش‌فرض 3000 است. اگر در `.env` تغییر داده باشید، از همان استفاده کنید.

### Swagger Documentation

برای مشاهده مستندات کامل Swagger:

```
http://localhost:3000/api-docs
```

---

## Authentication Endpoints

### 1. ورود با رمز عبور (مدیر/منشی)

```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "09123456789",
  "password": "your-password"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "ورود موفقیت‌آمیز بود",
  "data": {
    "user": {
      "id": "uuid",
      "phoneNumber": "09123456789",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN"
    }
  }
}
```

**نکته:** این endpoint فقط برای مدیر و منشی است. بیماران نمی‌توانند از این روش استفاده کنند.

### 2. دریافت CSRF Token

```http
GET /api/auth/csrf-token
```

**نکته:** این endpoint نیاز به احراز هویت دارد. برای درخواست‌های POST/PATCH/DELETE باید از این token استفاده کنید.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "csrfToken": "csrf-token-here"
  }
}
```

**استفاده:** در header درخواست‌های بعدی این token را ارسال کنید:
```
X-CSRF-Token: csrf-token-here
```

### 3. درخواست کد OTP

```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phoneNumber": "09123456789"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "کد تأیید ارسال شد"
}
```

### 4. تایید OTP و ورود/ثبت‌نام

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "09123456789",
  "code": "12345",
  "firstName": "نام",        // فقط برای کاربران جدید
  "lastName": "نام خانوادگی"  // فقط برای کاربران جدید
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "ورود موفقیت‌آمیز بود",
  "data": {
    "user": {
      "id": "uuid",
      "phoneNumber": "09123456789",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PATIENT"
    }
  }
}
```

### 5. خروج از حساب

```http
POST /api/auth/logout
X-CSRF-Token: your-csrf-token
```

**نکته:** نیاز به احراز هویت و CSRF token دارد.

### 6. دریافت اطلاعات کاربر جاری

```http
GET /api/auth/me
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phoneNumber": "09123456789",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN",
      "nationalCode": "1234567890",
      "address": "Tehran",
      "gender": "MALE"
    }
  }
}
```

### 7. به‌روزرسانی پروفایل

```http
PATCH /api/auth/me
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "firstName": "نام",
  "lastName": "نام خانوادگی",
  "nationalCode": "1234567890",
  "address": "آدرس",
  "gender": "MALE"  // MALE, FEMALE, OTHER
}
```

---

## Clinic Endpoints

### 1. لیست کلینیک‌ها

```http
GET /api/clinics?page=1&limit=10
```

**Query Parameters:**
- `page` (optional): شماره صفحه (default: 1)
- `limit` (optional): تعداد در هر صفحه (default: 10)

### 2. دریافت کلینیک

```http
GET /api/clinics/:id
```

### 3. ایجاد کلینیک (فقط مدیر)

```http
POST /api/clinics
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "name": "نام کلینیک",
  "address": "آدرس",
  "phoneNumber": "02188776655",
  "description": "توضیحات"
}
```

### 4. به‌روزرسانی کلینیک (مدیر/منشی)

```http
PATCH /api/clinics/:id
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "name": "نام جدید",
  "address": "آدرس جدید",
  "phoneNumber": "02188776655",
  "description": "توضیحات جدید"
}
```

**نکته:** منشی فقط می‌تواند کلینیک خود را ویرایش کند.

### 5. حذف کلینیک (فقط مدیر)

```http
DELETE /api/clinics/:id
X-CSRF-Token: your-csrf-token
```

---

## Doctor Endpoints

### 1. لیست پزشکان

```http
GET /api/doctors?page=1&limit=10&clinicId=uuid
```

**Query Parameters:**
- `page` (optional): شماره صفحه
- `limit` (optional): تعداد در هر صفحه
- `clinicId` (optional): فیلتر بر اساس کلینیک

### 2. دریافت پزشک

```http
GET /api/doctors/:id
```

### 3. ایجاد پزشک (مدیر/منشی)

```http
POST /api/doctors
X-CSRF-Token: your-csrf-token
Content-Type: multipart/form-data

{
  "firstName": "نام",
  "lastName": "نام خانوادگی",
  "university": "دانشگاه",
  "biography": "بیوگرافی",
  "skills": ["مهارت 1", "مهارت 2"],  // JSON array string
  "medicalLicenseNo": "12345",
  "clinicIds": ["uuid1", "uuid2"],   // JSON array string
  "profileImage": <file>
}
```

**نکته:** `skills` و `clinicIds` باید به صورت JSON string ارسال شوند.

### 4. به‌روزرسانی پزشک (مدیر/منشی)

```http
PATCH /api/doctors/:id
X-CSRF-Token: your-csrf-token
Content-Type: multipart/form-data

{
  "firstName": "نام جدید",
  "skills": ["مهارت جدید"],
  "clinicIds": ["uuid1"],
  "profileImage": <file>  // optional
}
```

### 5. حذف پزشک (فقط مدیر)

```http
DELETE /api/doctors/:id
X-CSRF-Token: your-csrf-token
```

---

## Article Endpoints

### 1. لیست مقالات

```http
GET /api/articles?page=1&limit=10&published=true
```

**Query Parameters:**
- `page` (optional): شماره صفحه
- `limit` (optional): تعداد در هر صفحه
- `published` (optional): true/false برای فیلتر مقالات منتشر شده

### 2. دریافت مقاله

```http
GET /api/articles/:identifier
```

**نکته:** می‌تواند با ID یا slug استفاده شود.

### 3. ایجاد مقاله (مدیر/منشی)

```http
POST /api/articles
X-CSRF-Token: your-csrf-token
Content-Type: multipart/form-data

{
  "title": "عنوان",
  "content": "محتوا",
  "excerpt": "خلاصه",
  "published": true,
  "coverImage": <file>
}
```

### 4. به‌روزرسانی مقاله (مدیر/منشی)

```http
PATCH /api/articles/:id
X-CSRF-Token: your-csrf-token
Content-Type: multipart/form-data

{
  "title": "عنوان جدید",
  "content": "محتوا جدید",
  "published": false,
  "coverImage": <file>  // optional
}
```

### 5. حذف مقاله (مدیر/منشی)

```http
DELETE /api/articles/:id
X-CSRF-Token: your-csrf-token
```

---

## Service Endpoints

### 1. لیست خدمات

```http
GET /api/services?page=1&limit=10
```

### 2. دریافت خدمت

```http
GET /api/services/:identifier
```

**نکته:** می‌تواند با ID یا slug استفاده شود.

### 3. ایجاد خدمت (مدیر/منشی)

```http
POST /api/services
X-CSRF-Token: your-csrf-token
Content-Type: multipart/form-data

{
  "title": "عنوان",
  "description": "توضیحات",
  "beforeTreatmentTips": "توصیه‌های قبل از درمان",
  "afterTreatmentTips": "توصیه‌های بعد از درمان",
  "price": 1000000,
  "durationMinutes": 60,
  "coverImage": <file>
}
```

### 4. به‌روزرسانی خدمت (مدیر/منشی)

```http
PATCH /api/services/:id
X-CSRF-Token: your-csrf-token
Content-Type: multipart/form-data

{
  "title": "عنوان جدید",
  "price": 1200000,
  "coverImage": <file>  // optional
}
```

### 5. حذف خدمت (مدیر/منشی)

```http
DELETE /api/services/:id
X-CSRF-Token: your-csrf-token
```

---

## Comment Endpoints

### 1. نظرات پزشکان

#### لیست نظرات

```http
GET /api/comments/doctor/:doctorId?page=1&limit=10
```

#### ثبت نظر

```http
POST /api/comments/doctor/:doctorId
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "content": "پزشک بسیار حرفه‌ای و دلسوزی هستند",
  "rating": 5
}
```

**نکته:** فقط کاربران احراز هویت شده می‌توانند نظر ثبت کنند.

### 2. نظرات مقالات

#### لیست نظرات

```http
GET /api/comments/article/:articleId?page=1&limit=10
```

#### ثبت نظر

```http
POST /api/comments/article/:articleId
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "content": "مقاله بسیار مفیدی بود، ممنون",
  "rating": 5
}
```

### 3. نظرات خدمات

#### لیست نظرات

```http
GET /api/comments/service/:serviceId?page=1&limit=10
```

#### ثبت نظر

```http
POST /api/comments/service/:serviceId
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "content": "خدمات عالی ارائه می‌دهند",
  "rating": 4
}
```

### 4. مدیریت نظرات

#### به‌روزرسانی نظر

```http
PATCH /api/comments/:id
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "content": "متن جدید",
  "rating": 4
}
```

**نکته:** فقط صاحب نظر می‌تواند آن را ویرایش کند.

#### حذف نظر

```http
DELETE /api/comments/:id
X-CSRF-Token: your-csrf-token
```

**نکته:** صاحب نظر یا مدیر می‌تواند نظر را حذف کند.

---

## FAQ Endpoints

### 1. لیست سوالات متداول

```http
GET /api/faqs?page=1&limit=10&published=true
```

### 2. دریافت سوال متداول

```http
GET /api/faqs/:id
```

### 3. ایجاد سوال متداول (مدیر/منشی)

```http
POST /api/faqs
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "question": "آیا درمان ریشه درد دارد؟",
  "answer": "درمان ریشه با بی‌حسی موضعی انجام می‌شود و درد ندارد",
  "order": 1,
  "published": true
}
```

### 4. به‌روزرسانی سوال متداول (مدیر/منشی)

```http
PATCH /api/faqs/:id
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "question": "سوال جدید",
  "answer": "پاسخ جدید",
  "order": 1,
  "published": true
}
```

### 5. حذف سوال متداول (مدیر/منشی)

```http
DELETE /api/faqs/:id
X-CSRF-Token: your-csrf-token
```

### 6. ترتیب‌بندی سوالات متداول (مدیر/منشی)

```http
POST /api/faqs/reorder
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "faqs": [
    {
      "id": "uuid1",
      "order": 1
    },
    {
      "id": "uuid2",
      "order": 2
    }
  ]
}
```

---

## Gallery Endpoints

### 1. لیست تصاویر گالری

```http
GET /api/gallery?page=1&limit=10&published=true
```

### 2. دریافت تصویر گالری

```http
GET /api/gallery/:id
```

### 3. آپلود تصویر گالری (مدیر/منشی)

```http
POST /api/gallery
X-CSRF-Token: your-csrf-token
Content-Type: multipart/form-data

{
  "title": "تصویر کلینیک",
  "description": "توضیحات تصویر",
  "order": 1,
  "published": "true",
  "galleryImage": <file>
}
```

### 4. به‌روزرسانی تصویر گالری (مدیر/منشی)

```http
PATCH /api/gallery/:id
X-CSRF-Token: your-csrf-token
Content-Type: multipart/form-data

{
  "title": "عنوان جدید",
  "published": "false",
  "galleryImage": <file>  // optional
}
```

### 5. حذف تصویر گالری (مدیر/منشی)

```http
DELETE /api/gallery/:id
X-CSRF-Token: your-csrf-token
```

### 6. ترتیب‌بندی تصاویر گالری (مدیر/منشی)

```http
POST /api/gallery/reorder
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "images": [
    {
      "id": "uuid1",
      "order": 1
    },
    {
      "id": "uuid2",
      "order": 2
    }
  ]
}
```

---

## Settings Endpoints

### 1. دریافت تنظیمات سایت

```http
GET /api/settings
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "siteName": "کلینیک دندانپزشکی",
    "siteTitle": "بهترین خدمات",
    "description": "توضیحات",
    "logo": "logo.png",
    "email": "info@clinic.com",
    "phoneNumber": "021-12345678",
    "address": "تهران",
    "workingHours": "شنبه تا پنج‌شنبه: 9-18",
    "socialMedia": {
      "instagram": "https://instagram.com/clinic",
      "telegram": "https://t.me/clinic",
      "whatsapp": "09123456789"
    }
  }
}
```

### 2. دریافت لینک‌های شبکه‌های اجتماعی

```http
GET /api/settings/social-media
```

### 3. به‌روزرسانی تنظیمات سایت (فقط مدیر)

```http
PATCH /api/settings
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "siteName": "کلینیک دندانپزشکی تهران",
  "siteTitle": "کلینیک دندانپزشکی",
  "description": "بهترین خدمات دندانپزشکی",
  "logo": "logo.png",
  "email": "info@clinic.com",
  "phoneNumber": "021-12345678",
  "address": "تهران، خیابان ولیعصر",
  "workingHours": "شنبه تا پنج‌شنبه: 9-18",
  "instagram": "https://instagram.com/clinic",
  "telegram": "https://t.me/clinic",
  "whatsapp": "09123456789",
  "twitter": "https://twitter.com/clinic",
  "linkedin": "https://linkedin.com/clinic",
  "facebook": "https://facebook.com/clinic",
  "youtube": "https://youtube.com/clinic"
}
```

### 4. به‌روزرسانی لینک‌های شبکه‌های اجتماعی (فقط مدیر)

```http
PATCH /api/settings/social-media
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "instagram": "https://instagram.com/clinic",
  "telegram": "https://t.me/clinic",
  "whatsapp": "09123456789",
  "twitter": "https://twitter.com/clinic",
  "linkedin": "https://linkedin.com/clinic",
  "facebook": "https://facebook.com/clinic",
  "youtube": "https://youtube.com/clinic"
}
```

---

## Insurance Endpoints

### 1. لیست سازمان‌های بیمه

```http
GET /api/insurance?page=1&limit=10&published=true
```

### 2. دریافت سازمان بیمه

```http
GET /api/insurance/:id
```

### 3. ایجاد سازمان بیمه (فقط مدیر)

```http
POST /api/insurance
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "name": "تأمین اجتماعی",
  "description": "سازمان تأمین اجتماعی ایران",
  "website": "https://tamin.ir",
  "phoneNumber": "021-12345678",
  "email": "info@tamin.ir",
  "logo": "tamin-logo.png",
  "published": true,
  "order": 1
}
```

### 4. به‌روزرسانی سازمان بیمه (فقط مدیر)

```http
PATCH /api/insurance/:id
X-CSRF-Token: your-csrf-token
Content-Type: application/json

{
  "name": "تأمین اجتماعی",
  "description": "توضیحات جدید",
  "published": false,
  "order": 2
}
```

### 5. حذف سازمان بیمه (فقط مدیر)

```http
DELETE /api/insurance/:id
X-CSRF-Token: your-csrf-token
```

### 6. تغییر وضعیت انتشار سازمان بیمه (فقط مدیر)

```http
PATCH /api/insurance/:id/toggle-status
X-CSRF-Token: your-csrf-token
```

---

## Health Check

### بررسی وضعیت سرور

```http
GET /api/health
```

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🔐 احراز هویت

این سیستم از **Session-based authentication** استفاده می‌کند. پس از ورود موفق، یک session برای کاربر ایجاد می‌شود که در دیتابیس PostgreSQL ذخیره می‌گردد.

### دو روش ورود:

#### 1️⃣ ورود با رمز عبور (Admin & Secretary)

```http
POST /api/auth/login
{
  "phoneNumber": "09123456789",
  "password": "your-password"
}
```

- فقط برای مدیر و منشی
- سریع و بدون نیاز به SMS
- رمز عبور هنگام ایجاد کاربر در CLI تنظیم می‌شود

#### 2️⃣ ورود با OTP (همه کاربران)

1. کاربر شماره تلفن خود را وارد می‌کند → `/api/auth/request-otp`
2. سیستم یک کد OTP 5 رقمی ارسال می‌کند
3. کاربر کد را وارد می‌کند → `/api/auth/verify-otp`
4. اگر کاربر جدید باشد، نام و نام خانوادگی نیز درخواست می‌شود
5. Session ایجاد می‌شود و کاربر وارد می‌گردد

**نکته:** بیماران فقط از روش OTP می‌توانند استفاده کنند. مدیر و منشی می‌توانند از هر دو روش استفاده کنند.

### Cookie Settings:

- نام: `dental.sid`
- HttpOnly: true
- Secure: true (در production)
- SameSite: lax
- مدت اعتبار: 30 روز (قابل تنظیم در `.env`)

---

## 👥 نقش‌های کاربری

### مدیر (ADMIN)

**دسترسی‌ها:**
- دسترسی کامل به تمام بخش‌ها
- ایجاد/حذف کلینیک
- ایجاد/حذف پزشک
- مدیریت مقالات و خدمات
- مدیریت سوالات متداول و گالری
- مدیریت تنظیمات سایت
- مدیریت سازمان‌های بیمه
- حذف نظرات

**روش ورود:**
- Password Login
- OTP Login

**ساخت اکانت:**
```bash
npm run create:admin
```

### منشی (SECRETARY)

**دسترسی‌ها:**
- مربوط به یک کلینیک خاص
- ویرایش اطلاعات کلینیک خود
- ایجاد/ویرایش پزشک
- مدیریت مقالات و خدمات
- مدیریت سوالات متداول و گالری

**روش ورود:**
- Password Login (پیشنهادی)
- OTP Login

**ساخت اکانت:**
```bash
npm run create:secretary
```

### بیمار (PATIENT)

**دسترسی‌ها:**
- مشاهده اطلاعات عمومی
- ثبت نظر برای پزشکان، مقالات و خدمات
- مدیریت پروفایل خود
- (آینده) رزرو نوبت

**روش ورود:**
- OTP Login (فقط)

**ساخت اکانت:**
- خودکار هنگام اولین ورود با OTP

---

## 🛡️ امنیت

### CSRF Protection

تمام درخواست‌های POST, PATCH, DELETE نیاز به CSRF token دارند:

1. ابتدا CSRF token را دریافت کنید:
   ```http
   GET /api/auth/csrf-token
   ```

2. در header درخواست‌های بعدی ارسال کنید:
   ```
   X-CSRF-Token: your-csrf-token
   ```

### Rate Limiting

**محدودیت‌های عمومی:**
- همه endpoints: 100 درخواست در 15 دقیقه

**محدودیت‌های Authentication:**
- Request OTP: 5 درخواست در 15 دقیقه
- Verify OTP: 10 درخواست در 15 دقیقه
- Login: 10 درخواست در 15 دقیقه

این محدودیت‌ها برای جلوگیری از حملات brute force و spam طراحی شده‌اند.

### Security Headers

سیستم از Helmet برای تنظیمات امنیتی استفاده می‌کند:
- Content Security Policy (CSP)
- HSTS (HTTP Strict Transport Security)
- XSS Protection
- و سایر هدرهای امنیتی

### Validation

تمام ورودی‌ها با Joi validation شده و HTML content با sanitize-html پاکسازی می‌شود.

### Session Security

- Session ها در PostgreSQL ذخیره می‌شوند
- HttpOnly cookies برای جلوگیری از XSS
- Secure flag در production
- SameSite: lax برای جلوگیری از CSRF

---

## 🔧 دستورات مفید

```bash
# اجرای سرور در حالت توسعه
npm run dev

# اجرای سرور در حالت production
npm start

# Generate Prisma Client
npm run prisma:generate

# ایجاد migration جدید
npm run prisma:migrate

# باز کردن Prisma Studio
npm run prisma:studio

# ایجاد کاربر مدیر
npm run create:admin

# ایجاد کاربر منشی
npm run create:secretary
```

---

## 📝 نکات مهم

1. **امنیت**: حتماً `SESSION_SECRET` را در production تغییر دهید
2. **SMS**: برای استفاده از سیستم OTP، حتماً API Key کاوه‌نگار را تنظیم کنید
3. **آپلود فایل**: حداکثر حجم فایل پیش‌فرض 5MB است (قابل تنظیم در `.env`)
4. **Rate Limiting**: برای جلوگیری از حملات، محدودیت درخواست اعمال شده است
5. **CORS**: دامنه‌های مجاز را در `ALLOWED_ORIGINS` تنظیم کنید
6. **CSRF Token**: برای درخواست‌های POST/PATCH/DELETE حتماً CSRF token دریافت و ارسال کنید
7. **OTP Expiry**: OTP ها به صورت خودکار بعد از 5 دقیقه پاک می‌شوند (قابل تنظیم)

---

## 🐛 رفع مشکلات رایج

### خطای اتصال به دیتابیس

- مطمئن شوید PostgreSQL در حال اجرا است
- `DATABASE_URL` را بررسی کنید
- دسترسی کاربر دیتابیس را چک کنید

### خطای ارسال SMS

- API Key کاوه‌نگار را بررسی کنید
- اعتبار حساب را چک کنید
- شماره فرستنده (SENDER) را بررسی کنید

### خطای آپلود فایل

- مطمئن شوید فولدرهای `uploads/doctors`، `uploads/gallery` و `uploads/images` وجود دارند
- دسترسی‌های فولدر را بررسی کنید
- حجم فایل را چک کنید (حداکثر 5MB)

### خطای CSRF Token

- مطمئن شوید session فعال است
- CSRF token را از endpoint مربوطه دریافت کنید
- header `X-CSRF-Token` را ارسال کنید

### خطای Rate Limit

- صبر کنید تا زمان محدودیت تمام شود
- یا IP خود را از محدودیت حذف کنید (در development)

---

## 📄 License

MIT

## 👨‍💻 توسعه‌دهنده

این پروژه توسط تیم توسعه سیستم مدیریت کلینیک دندانپزشکی ساخته شده است.
