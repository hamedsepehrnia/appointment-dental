<div dir="rtl">

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/English-007ACC?style=for-the-badge&logo=readme&logoColor=white" alt="English"></a>
  <a href="README.fa.md"><img src="https://img.shields.io/badge/فارسی-00A550?style=for-the-badge&logo=readme&logoColor=white" alt="Persian"></a>
</p>

---

# 🦷 سیستم مدیریت نوبت‌دهی کلینیک دندانپزشکی

یک API کامل و حرفه‌ای برای مدیریت نوبت‌دهی کلینیک دندانپزشکی با استفاده از Express.js، MySQL و Prisma.

---

## 📋 فهرست مطالب

- [ویژگی‌ها](#-ویژگیها)
- [تکنولوژی‌ها](#-تکنولوژیها)
- [پیش‌نیازها](#-پیشنیازها)
- [شروع سریع](#-شروع-سریع)
- [ابزارهای CLI](#-ابزارهای-cli)
- [ساختار پروژه](#-ساختار-پروژه)
- [مستندات API](#-مستندات-api)
- [سیستم نوبت‌دهی](#-سیستم-نوبتدهی)
- [سیستم نوتیفیکیشن](#-سیستم-نوتیفیکیشن)
- [احراز هویت](#-احراز-هویت)
- [نقش‌های کاربری](#-نقشهای-کاربری)
- [امنیت](#-امنیت)
- [رفع مشکلات](#-رفع-مشکلات)

---

## ✨ ویژگی‌ها

### 📅 سیستم نوبت‌دهی

- ✅ رزرو نوبت با یا بدون انتخاب پزشک
- ✅ امکان رزرو برای خود یا دیگران
- ✅ فرآیند تأیید توسط منشی
- ✅ پیامک خودکار در مراحل مختلف
- ✅ یادآوری ۲۴ ساعت و ۳۰ دقیقه قبل
- ✅ سیستم نوتیفیکیشن برای پنل ادمین

### 👥 مدیریت کاربران

- ✅ احراز هویت دوگانه: رمز عبور (ادمین/منشی) و OTP (همه کاربران)
- ✅ سه نقش کاربری: مدیر، منشی، بیمار
- ✅ مدیریت پروفایل کاربران
- ✅ مدیریت سشن با ذخیره در MySQL

### 🏥 مدیریت کلینیک‌ها

- ✅ ثبت و مدیریت اطلاعات کلینیک‌ها
- ✅ اختصاص منشی به هر کلینیک
- ✅ رابطه چند به یک

### 👨‍⚕️ مدیریت پزشکان

- ✅ اطلاعات کامل پزشکان
- ✅ آپلود تصویر پروفایل
- ✅ ارتباط چند به چند با کلینیک‌ها
- ✅ جستجو و فیلتر بر اساس کلینیک

### 📝 مدیریت محتوا

- ✅ مقالات با slug برای SEO
- ✅ خدمات با تعرفه و مدت زمان
- ✅ سوالات متداول با ترتیب‌بندی
- ✅ گالری تصاویر
- ✅ تنظیمات سایت و شبکه‌های اجتماعی
- ✅ سازمان‌های بیمه

### 💬 سیستم نظرات

- ✅ نظر برای پزشکان، مقالات، خدمات
- ✅ محاسبه خودکار میانگین امتیاز
- ✅ سیستم کامنت چندریختی

---

## 🛠 تکنولوژی‌ها

| دسته | تکنولوژی |
|------|----------|
| **فریم‌ورک** | Express.js |
| **دیتابیس** | MySQL |
| **ORM** | Prisma |
| **احراز هویت** | Session-based (express-session + mysql2) |
| **سرویس پیامک** | کاوه‌نگار |
| **آپلود فایل** | Multer |
| **اعتبارسنجی** | Joi |
| **امنیت** | Helmet, CORS, Rate Limiting, CSRF |
| **رمزنگاری** | bcryptjs |
| **لاگ** | Winston, Morgan |
| **مستندات** | Swagger/OpenAPI |
| **پاکسازی HTML** | sanitize-html |
| **فشرده‌سازی** | express-compression |

---

## 📦 پیش‌نیازها

| نیازمندی | نسخه |
|----------|------|
| Node.js | v16+ |
| MySQL | v8+ |
| npm یا yarn | آخرین نسخه |
| کلید API کاوه‌نگار | برای ارسال پیامک |

---

## 🚀 شروع سریع

### ۱. کلون کردن پروژه

</div>

```bash
git clone <repository-url>
cd appointment-dental
```

<div dir="rtl">

### ۲. نصب وابستگی‌ها

</div>

```bash
npm install
```

<div dir="rtl">

### ۳. ایجاد فایل محیطی

از ابزار CLI تعاملی برای ایجاد فایل `.env` استفاده کنید:

</div>

```bash
npm run create:env
```

<div dir="rtl">

این ابزار شما را در تنظیم موارد زیر راهنمایی می‌کند:
- محیط (Development/Production)
- اطلاعات دیتابیس
- تنظیمات سشن
- سرویس پیامک (کاوه‌نگار)
- تنظیمات CORS
- و موارد دیگر...

**یا به صورت دستی فایل `.env` را ایجاد کنید:**

</div>

```env
# دیتابیس
DATABASE_URL="mysql://username:password@localhost:3306/appointment_dental"

# سرور
PORT=4000
NODE_ENV=development
SERVE_MODE=combined

# سشن
SESSION_SECRET=your-super-secret-key-here
SESSION_MAX_AGE=2592000000

# پیامک کاوه‌نگار
KAVENEGAR_API_KEY=your-api-key
KAVENEGAR_SENDER=your-sender-number
OTP_TEMPLATE=verify
SMS_LOG_ONLY=true

# OTP
OTP_EXPIRY_SECONDS=300

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# آپلود فایل
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads
```

<div dir="rtl">

### ۴. راه‌اندازی دیتابیس

</div>

```bash
# ایجاد Prisma Client
npm run prisma:generate

# اجرای مایگریشن‌ها
npm run prisma:migrate

# (اختیاری) باز کردن Prisma Studio
npm run prisma:studio
```

<div dir="rtl">

### ۵. ایجاد فولدرهای آپلود

</div>

```bash
# Linux/Mac
mkdir -p uploads/{doctors,gallery,images,documents,insurance,site,users,videos}

# Windows PowerShell
New-Item -ItemType Directory -Force -Path uploads/doctors, uploads/gallery, uploads/images, uploads/documents, uploads/insurance, uploads/site, uploads/users, uploads/videos
```

<div dir="rtl">

### ۶. ایجاد کاربر مدیر

</div>

```bash
npm run create:admin
```

<div dir="rtl">

### ۷. اجرای سرور

</div>

```bash
# حالت توسعه
npm run dev

# حالت پروداکشن
npm start
```

<div dir="rtl">

سرور روی `http://localhost:4000` (یا پورت تنظیم شده) اجرا می‌شود.

---

## 🔧 ابزارهای CLI

### تنظیم محیط

</div>

```bash
npm run create:env
```

<div dir="rtl">

ابزار CLI تعاملی که فایل `.env` شما را با موارد زیر ایجاد می‌کند:

| قابلیت | توضیحات |
|--------|---------|
| انتخاب محیط | Development یا Production |
| تنظیم دیتابیس | نام کاربری، رمز عبور، نام دیتابیس |
| کلید سشن | ایجاد خودکار کلید ۱۲۸ کاراکتری |
| تنظیم پیامک | کلید API و شماره ارسال کاوه‌نگار |
| تنظیم CORS | دامنه‌های مجاز |
| مقادیر پیش‌فرض | PORT، MAX_FILE_SIZE، UPLOAD_PATH و... |

**تنظیمات حالت Development:**
- `NODE_ENV=development`
- `SERVE_MODE=combined`
- `SMS_LOG_ONLY=true` (کدهای OTP لاگ می‌شوند، ارسال نمی‌شوند)

**تنظیمات حالت Production:**
- `NODE_ENV=production`
- `SERVE_MODE=combined`
- `SMS_LOG_ONLY=false` (پیامک واقعی ارسال می‌شود)

---

### مدیریت کاربران

</div>

```bash
# ایجاد کاربر مدیر
npm run create:admin

# ایجاد کاربر منشی
npm run create:secretary

# اضافه کردن پزشکان نمونه
npm run seed:doctors
```

<div dir="rtl">

---

### دستورات دیتابیس

</div>

```bash
# ایجاد Prisma Client
npm run prisma:generate

# اجرای مایگریشن‌ها
npm run prisma:migrate

# باز کردن Prisma Studio
npm run prisma:studio
```

<div dir="rtl">

---

## 📁 ساختار پروژه

</div>

```
appointment-dental/
├── prisma/
│   ├── migrations/          # مایگریشن‌های دیتابیس
│   └── schema.prisma        # اسکیمای Prisma
├── src/
│   ├── cli/
│   │   ├── createEnv.js     # ابزار تنظیم محیط
│   │   ├── createUser.js    # ایجاد ادمین/منشی
│   │   └── seedDoctors.js   # داده‌های نمونه
│   ├── config/
│   │   ├── database.js      # تنظیمات Prisma
│   │   └── session.js       # تنظیمات سشن
│   ├── controllers/
│   │   ├── appointmentController.js  # 📅 نوبت‌ها
│   │   ├── notificationController.js # 🔔 نوتیفیکیشن‌ها
│   │   ├── authController.js
│   │   ├── clinicController.js
│   │   ├── doctorController.js
│   │   ├── articleController.js
│   │   ├── serviceController.js
│   │   ├── commentController.js
│   │   ├── faqController.js
│   │   ├── galleryController.js
│   │   ├── settingsController.js
│   │   ├── insuranceController.js
│   │   └── uploadController.js
│   ├── middlewares/
│   │   ├── auth.js          # احراز هویت
│   │   ├── csrf.js          # محافظت CSRF
│   │   ├── errorHandler.js  # مدیریت خطا
│   │   ├── validation.js    # اعتبارسنجی Joi
│   │   ├── upload.js        # آپلود فایل
│   │   └── asyncHandler.js  # پوشش Async
│   ├── routes/
│   │   ├── appointmentRoutes.js  # 📅
│   │   ├── notificationRoutes.js # 🔔
│   │   └── ... (سایر روت‌ها)
│   ├── services/
│   │   └── smsService.js    # پیامک کاوه‌نگار
│   └── utils/
│       ├── helpers.js       # توابع کمکی
│       ├── sanitizeHtml.js  # پاکسازی HTML
│       ├── cleanupJob.js    # پاکسازی OTP
│       └── reminderJob.js   # یادآوری نوبت‌ها
├── uploads/                 # فایل‌های آپلود شده
├── logs/                    # فایل‌های لاگ
├── docs/                    # مستندات
├── dist/                    # بیلد فرانت‌اند (حالت combined)
├── .env                     # متغیرهای محیطی
├── server.js                # نقطه ورود
├── swagger-setup.js         # تنظیمات Swagger
└── README.md
```

<div dir="rtl">

---

## 📚 مستندات API

### آدرس پایه

</div>

```
http://localhost:4000/api
```

<div dir="rtl">

### مستندات Swagger

</div>

```
http://localhost:4000/api-docs
```

<div dir="rtl">

---

## 📅 سیستم نوبت‌دهی

### فرآیند نوبت‌دهی

</div>

```
بیمار نوبت رزرو می‌کند
         │
         ▼
   ┌─────────────────────────┐
   │ وضعیت: APPROVED_BY_USER │  پیامک به بیمار و منشی
   │ (در انتظار تأیید منشی)  │  ایجاد نوتیفیکیشن
   └─────────────────────────┘
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
    [تأیید]        [لغو]
       │             │
       ▼             ▼
┌─────────────┐ ┌─────────────┐
│FINAL_APPROVED│ │  CANCELED   │
│ پیامک تأیید │ │ پیامک لغو  │
└─────────────┘ └─────────────┘
       │
       ▼
┌─────────────────────┐
│  یادآوری ۲۴ ساعت   │
│  یادآوری ۳۰ دقیقه  │
└─────────────────────┘
```

<div dir="rtl">

### وضعیت‌های نوبت

| وضعیت | توضیحات |
|-------|---------|
| `PENDING` | در انتظار (استفاده نمی‌شود) |
| `APPROVED_BY_USER` | در انتظار تأیید منشی |
| `FINAL_APPROVED` | تأیید شده |
| `CANCELED` | لغو شده |

### Endpointهای نوبت‌دهی

#### ایجاد نوبت

</div>

```http
POST /api/appointments
X-CSRF-Token: <token>
Content-Type: application/json

{
  "clinicId": "uuid",
  "doctorId": "uuid",          // اختیاری
  "appointmentDate": "2025-12-15T14:30:00.000Z",
  "patientName": "علی محمدی",   // اختیاری (برای رزرو برای دیگران)
  "notes": "توضیحات"            // اختیاری
}
```

<div dir="rtl">

#### دریافت نوبت‌های من

</div>

```http
GET /api/appointments/my?page=1&limit=10&status=FINAL_APPROVED
```

<div dir="rtl">

#### دریافت همه نوبت‌ها (ادمین/منشی)

</div>

```http
GET /api/appointments?page=1&limit=10&status=APPROVED_BY_USER&search=علی
```

<div dir="rtl">

| پارامتر | توضیحات |
|---------|---------|
| `page` | شماره صفحه |
| `limit` | تعداد در صفحه |
| `status` | فیلتر بر اساس وضعیت |
| `clinicId` | فیلتر بر اساس کلینیک (فقط ادمین) |
| `doctorId` | فیلتر بر اساس پزشک |
| `fromDate` | از تاریخ (ISO) |
| `toDate` | تا تاریخ (ISO) |
| `search` | جستجو در نام، تلفن |

#### دریافت یک نوبت

</div>

```http
GET /api/appointments/:id
```

<div dir="rtl">

#### تأیید نوبت

</div>

```http
PATCH /api/appointments/:id/approve
X-CSRF-Token: <token>
```

<div dir="rtl">

#### لغو نوبت

</div>

```http
PATCH /api/appointments/:id/cancel
X-CSRF-Token: <token>
Content-Type: application/json

{
  "reason": "دلیل لغو"  // اختیاری
}
```

<div dir="rtl">

#### به‌روزرسانی نوبت

</div>

```http
PATCH /api/appointments/:id
X-CSRF-Token: <token>
Content-Type: application/json

{
  "appointmentDate": "2025-12-16T15:00:00.000Z",
  "doctorId": "uuid",
  "patientName": "نام جدید",
  "notes": "توضیحات جدید"
}
```

<div dir="rtl">

#### حذف نوبت (فقط ادمین)

</div>

```http
DELETE /api/appointments/:id
X-CSRF-Token: <token>
```

<div dir="rtl">

#### آمار نوبت‌ها

</div>

```http
GET /api/appointments/stats
```

<div dir="rtl">

**پاسخ:**

</div>

```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 150,
      "pending": 0,
      "approvedByUser": 12,
      "finalApproved": 120,
      "canceled": 18,
      "todayAppointments": 5
    }
  }
}
```

<div dir="rtl">

### پیامک‌های سیستم

| رویداد | گیرنده | توضیحات |
|--------|--------|---------|
| ایجاد نوبت | بیمار | تأیید + در انتظار تأیید منشی |
| ایجاد نوبت | منشی | اطلاع‌رسانی نوبت جدید |
| تأیید نوبت | بیمار | تأیید با جزئیات |
| لغو نوبت | بیمار | اطلاع‌رسانی لغو |
| ۲۴ ساعت قبل | بیمار | یادآوری |
| ۳۰ دقیقه قبل | بیمار | یادآوری فوری |

---

## 🔔 سیستم نوتیفیکیشن

### Endpointهای نوتیفیکیشن

#### دریافت نوتیفیکیشن‌ها

</div>

```http
GET /api/notifications?page=1&limit=20&read=false
```

<div dir="rtl">

#### تعداد خوانده نشده

</div>

```http
GET /api/notifications/unread-count
```

<div dir="rtl">

**پاسخ:**

</div>

```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

<div dir="rtl">

#### علامت‌گذاری به عنوان خوانده شده

</div>

```http
PATCH /api/notifications/:id/read
X-CSRF-Token: <token>
```

<div dir="rtl">

#### خواندن همه

</div>

```http
PATCH /api/notifications/read-all
X-CSRF-Token: <token>
```

<div dir="rtl">

#### حذف نوتیفیکیشن

</div>

```http
DELETE /api/notifications/:id
X-CSRF-Token: <token>
```

<div dir="rtl">

---

## 🔐 احراز هویت

### دو روش احراز هویت

#### ۱. ورود با رمز عبور (ادمین/منشی)

</div>

```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "09123456789",
  "password": "your-password"
}
```

<div dir="rtl">

#### ۲. ورود با OTP (همه کاربران)

**مرحله ۱: درخواست OTP**

</div>

```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phoneNumber": "09123456789"
}
```

<div dir="rtl">

**مرحله ۲: تأیید OTP**

</div>

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "09123456789",
  "code": "12345",
  "firstName": "نام",        // برای کاربران جدید
  "lastName": "نام خانوادگی"  // برای کاربران جدید
}
```

<div dir="rtl">

### سایر Endpointهای احراز هویت

| Endpoint | متد | توضیحات |
|----------|-----|---------|
| `/api/auth/csrf-token` | GET | دریافت توکن CSRF |
| `/api/auth/me` | GET | دریافت کاربر جاری |
| `/api/auth/me` | PATCH | به‌روزرسانی پروفایل |
| `/api/auth/logout` | POST | خروج |

### تنظیمات کوکی

| خصوصیت | مقدار |
|--------|-------|
| نام | `dental.sid` |
| HttpOnly | `true` |
| Secure | `true` (پروداکشن) |
| SameSite | `lax` |
| مدت اعتبار | ۳۰ روز |

---

## 👥 نقش‌های کاربری

### مدیر (Admin)

| دسترسی | مجوز |
|--------|------|
| دسترسی کامل به همه بخش‌ها | ✅ |
| ایجاد/حذف کلینیک | ✅ |
| ایجاد/حذف پزشک | ✅ |
| مدیریت همه نوبت‌ها | ✅ |
| حذف نوبت‌ها | ✅ |
| مدیریت تنظیمات سایت | ✅ |
| مدیریت سازمان‌های بیمه | ✅ |
| حذف هر نظری | ✅ |

**ایجاد:**

</div>

```bash
npm run create:admin
```

<div dir="rtl">

### منشی (Secretary)

| دسترسی | مجوز |
|--------|------|
| مشاهده/ویرایش کلینیک خود | ✅ |
| ایجاد/ویرایش پزشکان | ✅ |
| مدیریت نوبت‌ها (کلینیک خود) | ✅ |
| تأیید/لغو نوبت‌ها | ✅ |
| مدیریت مقالات/خدمات | ✅ |
| مدیریت سوالات متداول/گالری | ✅ |

**ایجاد:**

</div>

```bash
npm run create:secretary
```

<div dir="rtl">

### بیمار (Patient)

| دسترسی | مجوز |
|--------|------|
| مشاهده اطلاعات عمومی | ✅ |
| رزرو نوبت | ✅ |
| مشاهده/لغو نوبت‌های خود | ✅ |
| ثبت نظر | ✅ |
| مدیریت پروفایل خود | ✅ |

**ایجاد:**
به صورت خودکار هنگام اولین ورود با OTP.

---

## 🛡️ امنیت

### محافظت CSRF

تمام درخواست‌های POST، PATCH، DELETE نیاز به توکن CSRF دارند:

</div>

```javascript
// ۱. دریافت توکن
const { data } = await api.get('/auth/csrf-token');
const csrfToken = data.data.csrfToken;

// ۲. استفاده در درخواست
await api.post('/appointments', formData, {
  headers: { 'X-CSRF-Token': csrfToken }
});
```

<div dir="rtl">

### محدودیت نرخ درخواست

| Endpoint | محدودیت |
|----------|---------|
| همه Endpointها | ۱۰۰ درخواست / ۱۵ دقیقه |
| درخواست OTP | ۵ درخواست / ۱۵ دقیقه |
| تأیید OTP | ۱۰ درخواست / ۱۵ دقیقه |
| ورود | ۱۰ درخواست / ۱۵ دقیقه |

### هدرهای امنیتی (Helmet)

- Content Security Policy (CSP)
- HSTS
- محافظت XSS
- و موارد دیگر...

### اعتبارسنجی ورودی

- همه ورودی‌ها با Joi اعتبارسنجی می‌شوند
- محتوای HTML با sanitize-html پاکسازی می‌شود

---

## 🐛 رفع مشکلات

### خطای اتصال به دیتابیس

| بررسی | راه‌حل |
|-------|-------|
| MySQL در حال اجرا | سرویس MySQL را شروع کنید |
| DATABASE_URL | در فایل `.env` بررسی کنید |
| دسترسی کاربر | دسترسی کاربر MySQL را چک کنید |

### خطای ارسال پیامک

| بررسی | راه‌حل |
|-------|-------|
| کلید API | کلید API کاوه‌نگار را بررسی کنید |
| موجودی حساب | اعتبار کاوه‌نگار را چک کنید |
| شماره ارسال | شماره فرستنده را بررسی کنید |

### خطای آپلود فایل

| بررسی | راه‌حل |
|-------|-------|
| فولدرها وجود دارند | فولدرهای آپلود را بسازید |
| دسترسی‌ها | دسترسی فولدرها را چک کنید |
| حجم فایل | حداکثر ۵MB (قابل تنظیم) |

### خطای CSRF Token

| بررسی | راه‌حل |
|-------|-------|
| سشن فعال | مطمئن شوید لاگین هستید |
| توکن دریافت شده | از `/api/auth/csrf-token` دریافت کنید |
| هدر ارسال شده | `X-CSRF-Token` را شامل کنید |

### خطای محدودیت درخواست

| راه‌حل |
|-------|
| صبر کنید تا محدودیت ریست شود |
| یا در محیط توسعه IP را whitelist کنید |

---

## 📝 نکات مهم

۱. **امنیت**: همیشه `SESSION_SECRET` را در پروداکشن تغییر دهید
۲. **پیامک**: API کاوه‌نگار را برای سیستم OTP تنظیم کنید
۳. **آپلود فایل**: حداکثر حجم پیش‌فرض ۵MB است (قابل تنظیم)
۴. **CORS**: `ALLOWED_ORIGINS` را برای دامنه‌های خود تنظیم کنید
۵. **CSRF**: همیشه توکن CSRF را برای POST/PATCH/DELETE ارسال کنید
۶. **انقضای OTP**: کدها بعد از ۵ دقیقه منقضی می‌شوند (قابل تنظیم)

---

## 📄 مجوز

MIT

---

## 👨‍💻 توسعه‌دهنده

ساخته شده توسط تیم توسعه سیستم مدیریت کلینیک دندانپزشکی.

---

📅 آخرین به‌روزرسانی: آذر ۱۴۰۳

</div>

