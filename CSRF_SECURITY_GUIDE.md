# راهنمای امنیت CSRF - سیستم نوبت‌دهی دندانپزشکی

## 📚 فهرست مطالب
- [مقدمه](#مقدمه)
- [CSRF چیست؟](#csrf-چیست)
- [مقایسه انواع CSRF](#مقایسه-انواع-csrf)
- [راهنمای استفاده](#راهنمای-استفاده)
- [مثال‌های کامل](#مثال‌های-کامل)
- [بهترین روش‌ها](#بهترین-روش‌ها)
- [تست و Debugging](#تست-و-debugging)

---

## مقدمه

این سیستم از **CSRF Protection** استفاده می‌کند تا از حملات Cross-Site Request Forgery جلوگیری کند.

### ✅ مزایای سیستم فعلی (CSRF سفارشی)
1. **کنترل کامل**: کد منبع باز و قابل تنظیم
2. **سازگار با Session**: استفاده از `express-session` موجود
3. **منعطف**: قابل سفارشی‌سازی برای هر endpoint
4. **بهبودپذیر**: بدون وابستگی به پکیج‌های deprecated
5. **Performance**: بدون overhead اضافی

---

## CSRF چیست؟

**Cross-Site Request Forgery** یک حمله امنیتی است که در آن:
- یک وبسایت مخرب درخواست HTTP را به سایت شما ارسال می‌کند
- بدون اطلاع کاربر، عملیات حساس انجام می‌شود
- مخصوصاً خطرناک برای عملیات POST, PUT, DELETE, PATCH

### مثال حمله:
```javascript
// در یک سایت مخرب (evil.com)
<img src="http://yoursite.com/api/clinics/delete/123" />
// بدون اطلاع کاربر، کلینیک حذف می‌شود!
```

### روش مقابله:
- استفاده از Token یکتا در هر session
- ارسال Token در header یا body درخواست
- اعتبارسنجی Token در هر درخواست حساس

---

## مقایسه انواع CSRF

### ❌ CSRF قدیمی (`csurf`)

```javascript
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: true });
```

**مشکلات:**
- ✅ پکیج معتبر و تست شده
- ❌ Deprecated شده و دیگر پشتیبانی نمی‌شود
- ❌ نیاز به cookie اضافی دارد
- ❌ محدودیت در سفارشی‌سازی
- ❌ مشکل با برخی middleware‌ها

**نصب:**
```bash
npm install csurf  # Deprecated!
```

---

### ✅ CSRF جدید (سفارشی)

```javascript
// src/middlewares/csrf.js
const crypto = require('crypto');
const generateCsrfToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};
```

**مزایا:**
- ✅ تمام کنترل دست در اختیار شماست
- ✅ استفاده از session موجود
- ✅ قابل تنظیم برای endpointهای مختلف
- ✅ هیچ وابستگی اضافی ندارد
- ✅ کار با تمام middleware ها

**نصب:**
```bash
# نیازی به نصب نیست! خود پروژه است
```

---

## راهنمای استفاده

### 1️⃣ دریافت CSRF Token

```javascript
// Frontend - دریافت Token
async function getCsrfToken() {
  const response = await fetch('http://localhost:3000/api/csrf-token', {
    credentials: 'include', // مهم! برای ارسال session cookie
  });
  
  const { data } = await response.json();
  return data.csrfToken;
}
```

### 2️⃣ ذخیره Token

```javascript
// به صورت Global یا State
let csrfToken = null;

async function initializeApp() {
  csrfToken = await getCsrfToken();
}
```

### 3️⃣ ارسال درخواست با CSRF Token

```javascript
// روش 1: ارسال در Header
async function createClinic(clinicData) {
  const response = await fetch('http://localhost:3000/api/clinics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken, // ← اینجا!
    },
    credentials: 'include', // برای session
    body: JSON.stringify(clinicData),
  });
  
  return response.json();
}

// روش 2: ارسال در Body
async function createDoctor(doctorData) {
  const response = await fetch('http://localhost:3000/api/doctors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      ...doctorData,
      csrfToken, // ← در body
    }),
  });
  
  return response.json();
}
```

---

## مثال‌های کامل

### مثال 1: React + Axios

```javascript
import axios from 'axios';

// تنظیم Axios
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // برای session
});

let csrfToken = null;

// دریافت و تنظیم CSRF Token
async function initCsrf() {
  const { data } = await api.get('/csrf-token');
  csrfToken = data.data.csrfToken;
  
  // تنظیم به صورت پیش‌فرض
  api.defaults.headers.common['X-CSRF-Token'] = csrfToken;
}

// استفاده
async function createClinic(clinicData) {
  try {
    await initCsrf(); // دریافت token
    
    const response = await api.post('/clinics', clinicData);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
    throw error;
  }
}
```

### مثال 2: Vanilla JavaScript

```javascript
class DentalAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.csrfToken = null;
  }

  async request(endpoint, options = {}) {
    // دریافت CSRF token اگر نداریم
    if (!this.csrfToken) {
      await this.getCsrfToken();
    }

    // اضافه کردن CSRF token به درخواست
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': this.csrfToken,
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    return response.json();
  }

  async getCsrfToken() {
    const response = await fetch(`${this.baseURL}/csrf-token`, {
      credentials: 'include',
    });
    const { data } = await response.json();
    this.csrfToken = data.csrfToken;
  }

  async createClinic(data) {
    return this.request('/clinics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClinic(id, data) {
    return this.request(`/clinics/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteClinic(id) {
    return this.request(`/clinics/${id}`, {
      method: 'DELETE',
    });
  }
}

// استفاده
const api = new DentalAPI('http://localhost:3000/api');

// ایجاد کلینیک
api.createClinic({
  name: 'کلینیک دندانپزشکی تهران',
  address: 'تهران، خیابان ولیعصر',
  phoneNumber: '021-12345678',
});
```

### مثال 3: jQuery + AJAX

```javascript
let csrfToken = null;

// دریافت CSRF Token
function getCsrfToken() {
  return $.ajax({
    url: 'http://localhost:3000/api/csrf-token',
    xhrFields: {
      withCredentials: true, // مهم!
    },
    success: function(data) {
      csrfToken = data.data.csrfToken;
    }
  });
}

// ارسال درخواست با CSRF Token
function createClinic(data) {
  $.ajax({
    url: 'http://localhost:3000/api/clinics',
    method: 'POST',
    xhrFields: {
      withCredentials: true,
    },
    headers: {
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json',
    },
    data: JSON.stringify(data),
    success: function(response) {
      console.log('Success:', response);
    },
    error: function(xhr) {
      console.error('Error:', xhr.responseJSON);
    }
  });
}
```

---

## بهترین روش‌ها

### ✅ انجام دهید

1. **همیشه credentials را فعال کنید**
   ```javascript
   credentials: 'include'  // Fetch API
   withCredentials: true   // jQuery, Axios
   ```

2. **Token را در Header قرار دهید**
   ```javascript
   headers: {
     'X-CSRF-Token': csrfToken,
   }
   ```

3. **Token را refresh کنید**
   ```javascript
   // بعد از هر خطای 403
   if (response.status === 403) {
     await refreshCsrfToken();
     // retry
   }
   ```

4. **Token را محافظت کنید**
   ```javascript
   // ذخیره در memory (React state)
   const [csrfToken, setCsrfToken] = useState(null);
   
   // نه در localStorage یا sessionStorage!
   ```

### ❌ انجام ندهید

1. **Credentials را فراموش نکنید**
   ```javascript
   ❌ fetch('/api/clinics', { ... })  // بدون credentials
   ✅ fetch('/api/clinics', { credentials: 'include' })
   ```

2. **Token را در localStorage ذخیره نکنید**
   ```javascript
   ❌ localStorage.setItem('csrfToken', token)
   ✅ const [token, setToken] = useState(null)
   ```

3. **Token را در URL قرار ندهید**
   ```javascript
   ❌ fetch(`/api/clinics?csrfToken=${token}`)
   ✅ fetch('/api/clinics', { headers: { 'X-CSRF-Token': token } })
   ```

---

## تست و Debugging

### تست با curl:

```bash
# 1. دریافت CSRF Token
curl -c cookies.txt -b cookies.txt \
  http://localhost:3000/api/csrf-token

# 2. استخراج Token از response
# فرض کنید token = "abc123..."

# 3. ارسال درخواست با Token
curl -c cookies.txt -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: abc123..." \
  -X POST \
  -d '{"name":"Test Clinic","address":"Tehran"}' \
  http://localhost:3000/api/clinics
```

### تست با Postman:

1. **Enable Cookie Handling**: Settings → Allow automatic cookie handling
2. **GET Request**: دریافت token از `/api/csrf-token`
3. **در response**, پیدا کردن `csrfToken`
4. **POST Request**: اضافه کردن header با نام `X-CSRF-Token`

### Debugging:

```javascript
// لاگ کردن token برای debugging
console.log('CSRF Token:', csrfToken);

// بررسی درخواست
fetch('/api/clinics', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  credentials: 'include',
})
.then(res => console.log('Status:', res.status))
.catch(err => console.error('Error:', err));
```

---

## سوالات متداول

### Q: چرا درخواست‌های GET CSRF ندارند؟
**A:** چون فقط خواندن می‌کنند و تغییری ایجاد نمی‌کنند.

### Q: چرا auth endpoints از CSRF مستثنی هستند؟
**A:** چون کاربر هنوز لاگین نکرده و session ندارد.

### Q: CSRF Token چقدر طول عمر دارد؟
**A:** تا زمانی که session active باشد. معمولاً 30 روز.

### Q: چگونه CSRF Token را Refresh کنم؟
**A:** درخواست جدید به `/api/csrf-token` ارسال کنید.

---

## خلاصه

✅ **سیستم جدید بهتر است** چون:
1. کنترل بیشتری داریم
2. سازگار با تمام middleware ها
3. بدون وابستگی به پکیج‌های deprecated
4. Performance بهتری دارد
5. قابل سفارشی‌سازی است

برای استفاده، فقط:
1. Token را از `/api/csrf-token` بگیرید
2. در header به نام `X-CSRF-Token` ارسال کنید
3. حتماً `credentials: 'include'` را فعال کنید

---

## تماس و پشتیبانی

در صورت بروز مشکل:
- بررسی کنید که `credentials: 'include'` فعال باشد
- مطمئن شوید که session در مرورگر کار می‌کند
- Console مرورگر را برای خطاهای CORS چک کنید

