# 🔐 راهنمای احراز هویت - Dental Appointment System

این سند راهنمای کامل احراز هویت در سیستم مدیریت نوبت‌دهی کلینیک دندانپزشکی است.

## 📋 فهرست

- [انواع روش‌های ورود](#انواع-روشهای-ورود)
- [ورود با رمز عبور](#ورود-با-رمز-عبور)
- [ورود با OTP](#ورود-با-otp)
- [مدیریت Session](#مدیریت-session)
- [نقش‌های کاربری](#نقشهای-کاربری)

---

## انواع روش‌های ورود

سیستم ما دو روش احراز هویت ارائه می‌دهد:

| روش | کاربران مجاز | استفاده |
|-----|-------------|---------|
| **Password Login** | Admin, Secretary | ورود سریع با رمز عبور |
| **OTP Login** | همه (Admin, Secretary, Patient) | ورود با کد یکبار مصرف |

---

## ورود با رمز عبور

### مخصوص: مدیر و منشی

این روش برای کاربران Admin و Secretary طراحی شده که نیاز به دسترسی سریع دارند.

### Endpoint

```http
POST /api/auth/login
Content-Type: application/json
```

### Request Body

```json
{
  "phoneNumber": "09123456789",
  "password": "your-password"
}
```

### Response Success (200)

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

### Response Error (401)

```json
{
  "success": false,
  "message": "شماره تلفن یا رمز عبور اشتباه است"
}
```

### Response Error (403 - Patient trying to use this method)

```json
{
  "success": false,
  "message": "این روش ورود فقط برای مدیر و منشی است"
}
```

### مثال با cURL

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "09123456789",
    "password": "admin123"
  }' \
  -c cookies.txt
```

**نکته:** از `-c cookies.txt` برای ذخیره session cookie استفاده کنید.

---

## ورود با OTP

### مخصوص: همه کاربران

این روش مشابه تلگرام است و برای بیماران اجباری و برای مدیر/منشی اختیاری است.

### مرحله 1: درخواست کد OTP

#### Endpoint

```http
POST /api/auth/request-otp
Content-Type: application/json
```

#### Request Body

```json
{
  "phoneNumber": "09123456789"
}
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "کد تایید ارسال شد",
  "data": {
    "isNewUser": false,
    "expiresIn": 300
  }
}
```

**توضیحات:**
- `isNewUser`: اگر `true` باشد، کاربر جدید است و باید نام و نام خانوادگی را در مرحله بعد وارد کند
- `expiresIn`: مدت زمان اعتبار کد به ثانیه (پیش‌فرض: 300 ثانیه = 5 دقیقه)

### مرحله 2: تایید کد OTP

#### Endpoint

```http
POST /api/auth/verify-otp
Content-Type: application/json
```

#### Request Body (کاربر قدیمی)

```json
{
  "phoneNumber": "09123456789",
  "code": "12345"
}
```

#### Request Body (کاربر جدید)

```json
{
  "phoneNumber": "09123456789",
  "code": "12345",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Response Success (200)

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

#### Response Error (400 - Invalid or expired OTP)

```json
{
  "success": false,
  "message": "کد تایید نامعتبر یا منقضی شده است"
}
```

### مثال کامل با cURL

```bash
# مرحله 1: درخواست OTP
curl -X POST http://localhost:4000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "09123456789"
  }'

# مرحله 2: تایید OTP (برای کاربر جدید)
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "09123456789",
    "code": "12345",
    "firstName": "John",
    "lastName": "Doe"
  }' \
  -c cookies.txt
```

---

## مدیریت Session

### دریافت اطلاعات کاربر جاری

```http
GET /api/auth/me
```

#### Response Success (200)

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
      "nationalCode": null,
      "address": null,
      "gender": null,
      "clinic": null
    }
  }
}
```

### به‌روزرسانی پروفایل

```http
PATCH /api/auth/me
Content-Type: application/json
```

#### Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "nationalCode": "1234567890",
  "address": "Tehran, Iran",
  "gender": "MALE"
}
```

**نکته:** همه فیلدها اختیاری هستند.

### خروج از سیستم

```http
POST /api/auth/logout
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "خروج موفقیت‌آمیز بود"
}
```

---

## نقش‌های کاربری

### 1. ADMIN (مدیر)

**دسترسی‌ها:**
- دسترسی کامل به تمام بخش‌ها
- ایجاد و حذف کلینیک
- ایجاد و حذف پزشک
- مدیریت مقالات و خدمات
- حذف نظرات کاربران
- ایجاد حساب منشی

**روش ورود:**
- Password Login (پیشنهادی)
- OTP Login

**ساخت اکانت:**
```bash
npm run create:admin
```

### 2. SECRETARY (منشی)

**دسترسی‌ها:**
- مربوط به یک کلینیک خاص
- ویرایش اطلاعات کلینیک خود
- ایجاد و ویرایش پزشک
- مدیریت مقالات و خدمات
- مشاهده نوبت‌ها (آینده)

**روش ورود:**
- Password Login (پیشنهادی)
- OTP Login

**ساخت اکانت:**
```bash
npm run create:secretary
```

### 3. PATIENT (بیمار)

**دسترسی‌ها:**
- مشاهده اطلاعات عمومی
- ثبت نظر برای پزشکان
- مدیریت پروفایل خود
- رزرو نوبت (آینده)

**روش ورود:**
- OTP Login (فقط)

**ساخت اکانت:**
- خودکار هنگام اولین ورود با OTP

---

## Cookie Settings

سیستم از **Session Cookie** با تنظیمات زیر استفاده می‌کند:

```javascript
{
  name: 'dental.sid',
  httpOnly: true,
  secure: true, // فقط در production
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 روز
}
```

### در Postman

برای حفظ session در Postman:
1. به **Settings** بروید
2. **Cookies** را فعال کنید
3. یا از **Interceptor** استفاده کنید

### در cURL

```bash
# ذخیره cookies
curl ... -c cookies.txt

# استفاده از cookies
curl ... -b cookies.txt
```

---

## Rate Limiting

### محدودیت‌های عمومی

- **همه endpoints:** 100 درخواست در 15 دقیقه

### محدودیت‌های Authentication

- **Request OTP:** 10 درخواست در 15 دقیقه
- **Verify OTP:** 10 درخواست در 15 دقیقه

این محدودیت‌ها برای جلوگیری از حملات brute force و spam طراحی شده‌اند.

---

## خطاهای رایج

### 401 Unauthorized

```json
{
  "success": false,
  "message": "لطفاً ابتدا وارد شوید"
}
```

**راه حل:** ابتدا login کنید و session cookie را ذخیره نگه دارید.

### 403 Forbidden

```json
{
  "success": false,
  "message": "شما دسترسی لازم را ندارید"
}
```

**راه حل:** این endpoint نیاز به نقش خاصی دارد که شما ندارید.

### 429 Too Many Requests

```json
{
  "success": false,
  "message": "تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً بعداً تلاش کنید."
}
```

**راه حل:** کمی صبر کنید (15 دقیقه) و دوباره تلاش کنید.

---

## مثال‌های عملی

### مثال 1: ورود Admin و ایجاد کلینیک

```bash
# ورود Admin
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09123456789","password":"admin123"}' \
  -c cookies.txt

# ایجاد کلینیک
curl -X POST http://localhost:4000/api/clinics \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Clinic 1",
    "address": "Tehran",
    "phoneNumber": "02188776655",
    "description": "Best clinic"
  }'
```

### مثال 2: ثبت‌نام و ورود بیمار با OTP

```bash
# درخواست OTP
curl -X POST http://localhost:4000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"09987654321"}'

# تایید OTP (کاربر جدید)
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber":"09987654321",
    "code":"12345",
    "firstName":"Ali",
    "lastName":"Ahmadi"
  }' \
  -c patient-cookies.txt

# ثبت نظر برای پزشک
curl -X POST http://localhost:4000/api/comments/doctor/DOCTOR_UUID \
  -H "Content-Type: application/json" \
  -b patient-cookies.txt \
  -d '{
    "content":"Excellent doctor!",
    "rating":5
  }'
```

---

## نکات امنیتی

✅ **همیشه از HTTPS استفاده کنید** (در production)  
✅ **SESSION_SECRET را تغییر دهید** (در production)  
✅ **Rate limiting فعال است** برای جلوگیری از حملات  
✅ **Password ها با bcrypt hash می‌شوند** (10 rounds)  
✅ **Session ها در PostgreSQL ذخیره می‌شوند** (نه memory)  
✅ **Cookie ها HttpOnly هستند** (محافظت در برابر XSS)

---

## سوالات متداول

### چرا بیمار نمی‌تواند با password login کند؟

برای امنیت بیشتر و تجربه کاربری بهتر، بیماران فقط از OTP استفاده می‌کنند (مثل تلگرام). این روش:
- نیازی به یادآوری رمز عبور ندارد
- امن‌تر است (کد هر بار تغییر می‌کند)
- کاربرپسندتر است

### آیا Admin می‌تواند با OTP هم login کند؟

بله! Admin و Secretary می‌توانند از هر دو روش استفاده کنند:
- Password Login: برای دسترسی سریع
- OTP Login: برای امنیت بیشتر

### Session چقدر اعتبار دارد؟

پیش‌فرض: **30 روز**

می‌توانید در `.env` تغییر دهید:
```env
SESSION_MAX_AGE=2592000000  # 30 days in milliseconds
```

---

این سند به طور مرتب به‌روزرسانی می‌شود. برای سوالات بیشتر به مستندات اصلی (README.md) مراجعه کنید.

