# 📋 لیست کامل API هایی که به CSRF Token نیاز دارند

## 🔍 نحوه کار CSRF Protection

بر اساس فایل `src/middlewares/csrf.js`:

### ✅ API هایی که CSRF نیاز ندارند:

1. **تمام GET Requests** - فقط خواندن
2. **Auth Endpoints** (معاف هستند):
   - `POST /api/auth/request-otp`
   - `POST /api/auth/verify-otp`
   - `POST /api/auth/login`
   - `POST /api/auth/logout`
3. **Health & Status**:
   - `GET /api/health`
   - `GET /api/csrf-token`
4. **Swagger Documentation**:
   - همه مسیرهای `/api-docs`

---

## ❌ API هایی که CSRF نیاز دارند (POST, PATCH, DELETE)

### 🔐 Authentication & Profile

| Method | Endpoint | نیاز به CSRF | توضیحات |
|--------|----------|--------------|---------|
| PATCH | `/api/auth/me` | ✅ بله | به‌روزرسانی پروفایل |

---

### 🏥 Clinics

| Method | Endpoint | نیاز به CSRF | دسترسی |
|--------|----------|--------------|---------|
| POST | `/api/clinics` | ✅ بله | Admin only |
| PATCH | `/api/clinics/:id` | ✅ بله | Admin/Secretary |
| DELETE | `/api/clinics/:id` | ✅ بله | Admin only |
| GET | `/api/clinics` | ❌ خیر | Public |
| GET | `/api/clinics/:id` | ❌ خیر | Public |

---

### 👨‍⚕️ Doctors

| Method | Endpoint | نیاز به CSRF | دسترسی |
|--------|----------|--------------|---------|
| POST | `/api/doctors` | ✅ بله | Admin/Secretary |
| PATCH | `/api/doctors/:id` | ✅ بله | Admin/Secretary |
| DELETE | `/api/doctors/:id` | ✅ بله | Admin only |
| GET | `/api/doctors` | ❌ خیر | Public |
| GET | `/api/doctors/:id` | ❌ خیر | Public |

---

### 📝 Articles

| Method | Endpoint | نیاز به CSRF | دسترسی |
|--------|----------|--------------|---------|
| POST | `/api/articles` | ✅ بله | Admin/Secretary |
| PATCH | `/api/articles/:id` | ✅ بله | Admin/Secretary |
| DELETE | `/api/articles/:id` | ✅ بله | Admin/Secretary |
| GET | `/api/articles` | ❌ خیر | Public |
| GET | `/api/articles/:identifier` | ❌ خیر | Public |

---

### 🛠️ Services

| Method | Endpoint | نیاز به CSRF | دسترسی |
|--------|----------|--------------|---------|
| POST | `/api/services` | ✅ بله | Admin/Secretary |
| PATCH | `/api/services/:id` | ✅ بله | Admin/Secretary |
| DELETE | `/api/services/:id` | ✅ بله | Admin/Secretary |
| GET | `/api/services` | ❌ خیر | Public |
| GET | `/api/services/:identifier` | ❌ خیر | Public |

---

### 💬 Comments

| Method | Endpoint | نیاز به CSRF | دسترسی |
|--------|----------|--------------|---------|
| POST | `/api/comments/doctor/:doctorId` | ✅ بله | Patient |
| POST | `/api/comments/article/:articleId` | ✅ بله | Patient |
| POST | `/api/comments/service/:serviceId` | ✅ بله | Patient |
| PATCH | `/api/comments/:id` | ✅ بله | Owner |
| DELETE | `/api/comments/:id` | ✅ بله | Owner or Admin |
| GET | `/api/comments/doctor/:doctorId` | ❌ خیر | Public |
| GET | `/api/comments/article/:articleId` | ❌ خیر | Public |
| GET | `/api/comments/service/:serviceId` | ❌ خیر | Public |

---

### ❓ FAQs

| Method | Endpoint | نیاز به CSRF | دسترسی |
|--------|----------|--------------|---------|
| POST | `/api/faqs` | ✅ بله | Admin/Secretary |
| PATCH | `/api/faqs/:id` | ✅ بله | Admin/Secretary |
| DELETE | `/api/faqs/:id` | ✅ بله | Admin/Secretary |
| POST | `/api/faqs/reorder` | ✅ بله | Admin/Secretary |
| GET | `/api/faqs` | ❌ خیر | Public |
| GET | `/api/faqs/:id` | ❌ خیر | Public |

---

### 🖼️ Gallery

| Method | Endpoint | نیاز به CSRF | دسترسی |
|--------|----------|--------------|---------|
| POST | `/api/gallery` | ✅ بله | Admin/Secretary |
| PATCH | `/api/gallery/:id` | ✅ بله | Admin/Secretary |
| DELETE | `/api/gallery/:id` | ✅ بله | Admin/Secretary |
| POST | `/api/gallery/reorder` | ✅ بله | Admin/Secretary |
| GET | `/api/gallery` | ❌ خیر | Public |
| GET | `/api/gallery/:id` | ❌ خیر | Public |

---

### ⚙️ Settings

| Method | Endpoint | نیاز به CSRF | دسترسی |
|--------|----------|--------------|---------|
| PATCH | `/api/settings` | ✅ بله | Admin |
| PATCH | `/api/settings/social-media` | ✅ بله | Admin |
| GET | `/api/settings` | ❌ خیر | Public |
| GET | `/api/settings/social-media` | ❌ خیر | Public |

---

### 🏥 Insurance Organizations

| Method | Endpoint | نیاز به CSRF | دسترسی |
|--------|----------|--------------|---------|
| POST | `/api/insurance` | ✅ بله | Admin |
| PATCH | `/api/insurance/:id` | ✅ بله | Admin |
| DELETE | `/api/insurance/:id` | ✅ بله | Admin |
| GET | `/api/insurance` | ❌ خیر | Public |
| GET | `/api/insurance/:id` | ❌ خیر | Public |

---

## 📊 خلاصه

### نیاز به CSRF دارند:
- ✅ تمام POST requests (غیر از auth)
- ✅ تمام PATCH requests
- ✅ تمام DELETE requests
- ✅ تمام PUT requests (اگر وجود داشته باشند)

### نیاز به CSRF ندارند:
- ❌ تمام GET requests
- ❌ `/api/auth/request-otp` (POST)
- ❌ `/api/auth/verify-otp` (POST)
- ❌ `/api/auth/login` (POST)
- ❌ `/api/auth/logout` (POST)

---

## 🔧 نحوه استفاده در Postman

### 1. دریافت CSRF Token
```
GET {{baseUrl}}/csrf-token
```

### 2. استفاده در Header
```
X-CSRF-Token: <token-received-from-step-1>
```

### 3. مثال کامل
```
POST {{baseUrl}}/clinics
Content-Type: application/json
X-CSRF-Token: your-csrf-token-here

{
  "name": "کلینیک جدید",
  "address": "تهران",
  "phoneNumber": "02112345678"
}
```

---

## ⚠️ نکات مهم

1. **Session Cookie** باید فعال باشد
2. **Token** را در Header با نام `X-CSRF-Token` ارسال کنید
3. **Token** برای هر Session یکتا است
4. **Token** تا پایان Session معتبر است
5. برای تغییر Token، دوباره `/api/csrf-token` را صدا بزنید

---

## 🧪 تست

برای تست اینکه یک API نیاز به CSRF دارد یا نه:

```bash
# بدون CSRF Token - باید 403 بدهد
curl -X POST http://localhost:3000/api/clinics \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'

# با CSRF Token - باید کار کند
curl -X GET http://localhost:3000/api/csrf-token
# Token را کپی کنید

curl -X POST http://localhost:3000/api/clinics \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <your-token>" \
  -b cookies.txt \
  -d '{"name":"Test"}'
```

---

**نسخه:** 1.0.0  
**تاریخ آخرین بررسی:** امروز

