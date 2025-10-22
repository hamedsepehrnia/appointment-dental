# سیستم مدیریت نوبت‌دهی کلینیک دندانپزشکی

یک API کامل و حرفه‌ای برای مدیریت نوبت‌دهی دو کلینیک دندانپزشکی با استفاده از Express.js، PostgreSQL و Prisma.

## 📋 فهرست مطالب

- [ویژگی‌ها](#ویژگیها)
- [تکنولوژی‌های استفاده شده](#تکنولوژیهای-استفاده-شده)
- [پیش‌نیازها](#پیشنیازها)
- [نصب و راه‌اندازی](#نصب-و-راهاندازی)
- [ساختار پروژه](#ساختار-پروژه)
- [API Documentation](#api-documentation)
- [احراز هویت](#احراز-هویت)
- [نقش‌های کاربری](#نقشهای-کاربری)

## ✨ ویژگی‌ها

### مدیریت کاربران
- سیستم احراز هویت با OTP (بدون نیاز به پسورد برای بیماران)
- سه نقش کاربری: مدیر، منشی، بیمار
- مدیریت پروفایل کاربران

### مدیریت کلینیک‌ها
- ثبت و مدیریت اطلاعات کلینیک‌ها
- اختصاص منشی به هر کلینیک (رابطه Many-to-One)
- مدیریت پزشکان در چند کلینیک (Many-to-Many)

### مدیریت پزشکان
- ثبت اطلاعات کامل پزشکان
- آپلود تصویر پروفایل
- لیست مهارت‌ها و بیوگرافی
- ارتباط با چندین کلینیک

### سیستم مقالات
- ایجاد، ویرایش و حذف مقالات
- حالت پیش‌نویس و منتشرشده
- آپلود تصویر کاور
- سیستم slug برای URL‌های SEO-friendly

### مدیریت خدمات
- ثبت خدمات دندانپزشکی
- تعرفه و مدت زمان هر خدمت
- توصیه‌های قبل و بعد از درمان
- آپلود تصویر کاور

### سیستم نظرات
- ثبت نظر و امتیاز برای پزشکان
- محاسبه میانگین امتیاز
- مدیریت نظرات توسط کاربران

## 🛠 تکنولوژی‌های استفاده شده

- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Session-based با express-session
- **SMS Service**: کاوه‌نگار (Kavenegar)
- **File Upload**: Multer
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs

## 📦 پیش‌نیازها

- Node.js (v16 یا بالاتر)
- PostgreSQL (v13 یا بالاتر)
- npm یا yarn

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

```powershell
New-Item -ItemType Directory -Force -Path uploads/doctors, uploads/images
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

سرور روی `http://localhost:3000` اجرا می‌شود.

## 📁 ساختار پروژه

```
appointment-dental/
├── prisma/
│   └── schema.prisma          # Prisma schema
├── src/
│   ├── cli/
│   │   └── createUser.js      # CLI برای ساخت مدیر/منشی
│   ├── config/
│   │   ├── database.js        # تنظیمات Prisma
│   │   └── session.js         # تنظیمات Session
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── clinicController.js
│   │   ├── doctorController.js
│   │   ├── articleController.js
│   │   ├── serviceController.js
│   │   └── commentController.js
│   ├── middlewares/
│   │   ├── auth.js            # Authentication middleware
│   │   ├── errorHandler.js    # Error handling
│   │   ├── validation.js      # Joi validation
│   │   ├── upload.js          # File upload
│   │   └── asyncHandler.js    # Async wrapper
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── clinicRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── articleRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── commentRoutes.js
│   │   └── index.js
│   ├── services/
│   │   └── smsService.js      # Kavenegar SMS
│   └── utils/
│       └── helpers.js          # Helper functions
├── uploads/                    # فایل‌های آپلود شده
│   ├── doctors/               # تصاویر پزشکان
│   └── images/                # تصاویر مقالات و خدمات
├── .env                       # متغیرهای محیطی
├── .gitignore
├── package.json
├── server.js                  # Entry point
└── README.md
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### درخواست کد OTP
```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phoneNumber": "09123456789"
}
```

#### تایید OTP و ورود/ثبت‌نام
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

#### خروج از حساب
```http
POST /api/auth/logout
```

#### دریافت اطلاعات کاربر جاری
```http
GET /api/auth/me
```

#### به‌روزرسانی پروفایل
```http
PATCH /api/auth/me
Content-Type: application/json

{
  "firstName": "نام",
  "lastName": "نام خانوادگی",
  "nationalCode": "1234567890",
  "address": "آدرس",
  "gender": "MALE"
}
```

### Clinic Endpoints

#### لیست کلینیک‌ها
```http
GET /api/clinics?page=1&limit=10
```

#### دریافت کلینیک
```http
GET /api/clinics/:id
```

#### ایجاد کلینیک (فقط مدیر)
```http
POST /api/clinics
Content-Type: application/json

{
  "name": "نام کلینیک",
  "address": "آدرس",
  "phoneNumber": "02188776655",
  "description": "توضیحات"
}
```

#### به‌روزرسانی کلینیک (مدیر/منشی)
```http
PATCH /api/clinics/:id
Content-Type: application/json

{
  "name": "نام جدید"
}
```

#### حذف کلینیک (فقط مدیر)
```http
DELETE /api/clinics/:id
```

### Doctor Endpoints

#### لیست پزشکان
```http
GET /api/doctors?page=1&limit=10&clinicId=uuid
```

#### دریافت پزشک
```http
GET /api/doctors/:id
```

#### ایجاد پزشک (مدیر/منشی)
```http
POST /api/doctors
Content-Type: multipart/form-data

{
  "firstName": "نام",
  "lastName": "نام خانوادگی",
  "university": "دانشگاه",
  "biography": "بیوگرافی",
  "skills": ["مهارت 1", "مهارت 2"],
  "medicalLicenseNo": "12345",
  "clinicIds": ["uuid1", "uuid2"],
  "profileImage": <file>
}
```

#### به‌روزرسانی پزشک (مدیر/منشی)
```http
PATCH /api/doctors/:id
Content-Type: multipart/form-data
```

#### حذف پزشک (فقط مدیر)
```http
DELETE /api/doctors/:id
```

### Article Endpoints

#### لیست مقالات
```http
GET /api/articles?page=1&limit=10&published=true
```

#### دریافت مقاله (با slug یا ID)
```http
GET /api/articles/:identifier
```

#### ایجاد مقاله (مدیر/منشی)
```http
POST /api/articles
Content-Type: multipart/form-data

{
  "title": "عنوان",
  "content": "محتوا",
  "excerpt": "خلاصه",
  "published": true,
  "coverImage": <file>
}
```

#### به‌روزرسانی مقاله (مدیر/منشی)
```http
PATCH /api/articles/:id
Content-Type: multipart/form-data
```

#### حذف مقاله (مدیر/منشی)
```http
DELETE /api/articles/:id
```

### Service Endpoints

#### لیست خدمات
```http
GET /api/services?page=1&limit=10
```

#### دریافت خدمت (با slug یا ID)
```http
GET /api/services/:identifier
```

#### ایجاد خدمت (مدیر/منشی)
```http
POST /api/services
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

#### به‌روزرسانی خدمت (مدیر/منشی)
```http
PATCH /api/services/:id
Content-Type: multipart/form-data
```

#### حذف خدمت (مدیر/منشی)
```http
DELETE /api/services/:id
```

### Comment Endpoints

#### لیست نظرات یک پزشک
```http
GET /api/comments/doctor/:doctorId?page=1&limit=10
```

#### ثبت نظر (فقط بیمار)
```http
POST /api/comments/doctor/:doctorId
Content-Type: application/json

{
  "content": "متن نظر",
  "rating": 5
}
```

#### به‌روزرسانی نظر (صاحب نظر)
```http
PATCH /api/comments/:id
Content-Type: application/json

{
  "content": "متن جدید",
  "rating": 4
}
```

#### حذف نظر (صاحب نظر یا مدیر)
```http
DELETE /api/comments/:id
```

## 🔐 احراز هویت

این سیستم از **Session-based authentication** استفاده می‌کند. پس از ورود موفق، یک session برای کاربر ایجاد می‌شود که در دیتابیس ذخیره می‌گردد.

### فرآیند ورود/ثبت‌نام (OTP):

1. کاربر شماره تلفن خود را وارد می‌کند
2. سیستم یک کد OTP 5 رقمی ارسال می‌کند
3. کاربر کد را وارد می‌کند
4. اگر کاربر جدید باشد، نام و نام خانوادگی نیز درخواست می‌شود
5. Session ایجاد می‌شود و کاربر وارد می‌گردد

### Cookie Settings:
- نام: `dental.sid`
- HttpOnly: true
- Secure: true (در production)
- SameSite: lax
- مدت اعتبار: 30 روز (قابل تنظیم)

## 👥 نقش‌های کاربری

### مدیر (ADMIN)
- دسترسی کامل به تمام بخش‌ها
- ایجاد/حذف کلینیک
- ایجاد/حذف پزشک
- مدیریت مقالات و خدمات
- حذف نظرات

### منشی (SECRETARY)
- مربوط به یک کلینیک خاص
- ویرایش اطلاعات کلینیک خود
- ایجاد/ویرایش پزشک
- مدیریت مقالات و خدمات

### بیمار (PATIENT)
- مشاهده اطلاعات عمومی
- ثبت نظر برای پزشکان
- مدیریت پروفایل خود
- (آینده) رزرو نوبت

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

## 📝 نکات مهم

1. **امنیت**: حتماً `SESSION_SECRET` را در production تغییر دهید
2. **SMS**: برای استفاده از سیستم OTP، حتماً API Key کاوه‌نگار را تنظیم کنید
3. **آپلود فایل**: حداکثر حجم فایل پیش‌فرض 5MB است
4. **Rate Limiting**: برای جلوگیری از حملات، محدودیت درخواست اعمال شده است
5. **CORS**: دامنه‌های مجاز را در `ALLOWED_ORIGINS` تنظیم کنید

## 🐛 رفع مشکلات رایج

### خطای اتصال به دیتابیس
- مطمئن شوید PostgreSQL در حال اجرا است
- `DATABASE_URL` را بررسی کنید

### خطای ارسال SMS
- API Key کاوه‌نگار را بررسی کنید
- اعتبار حساب را چک کنید

### خطای آپلود فایل
- مطمئن شوید فولدرهای `uploads/doctors` و `uploads/images` وجود دارند
- دسترسی‌های فولدر را بررسی کنید

## 📄 License

MIT

## 👨‍💻 توسعه‌دهنده

این پروژه توسط تیم توسعه سیستم مدیریت کلینیک دندانپزشکی ساخته شده است.

