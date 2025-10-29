# 📋 Todo List - React Integration برای سیستم نوبت‌دهی

**🔧 وضعیت:** HTML/CSS با Bootstrap آماده است  
**⚡ کار:** فقط React + API Integration  
**⏰ مدت زمان:** 10-14 روز (1-2 هفته)  
**⏱️ کل ساعت کار:** 40-60 ساعت

---

## 🎯 Day 1: Setup + API Service

**⏰ زمان:** 3-4 ساعت

**تسک‌ها:**
- [ ] ایجاد React App با Vite یا CRA
- [ ] نصب axios
- [ ] ایجاد ساختار پوشه‌ها:
  ```
  src/
    ├── api/          # API calls
    ├── context/      # Context providers
    ├── components/   # Reusable components
    ├── pages/        # Pages
    ├── utils/        # Helper functions
    └── hooks/        # Custom hooks
  ```
- [ ] ساخت API Service (api.js)
- [ ] تست اتصال با Backend
- [ ] ایجاد AuthContext برای Session

**خروجی:** API Service آماده ✅

---

## 🎯 Day 2: Authentication

**⏰ زمان:** 3-4 ساعت

**تسک‌ها:**
- [ ] ساخت صفحه Login (با HTML آماده)
- [ ] فرم Login → اتصال به API /auth/login
- [ ] مدیریت Session در Context
- [ ] ساخت صفحه Request OTP
- [ ] تایمر 60 ثانیه‌ای
- [ ] ساخت صفحه Verify OTP
- [ ] مدیریت Register Flow

**خروجی:** Authentication کامل ✅

---

## 🎯 Day 3: Layout & Navigation

**⏰ زمان:** 2-3 ساعت

**تسک‌ها:**
- [ ] اتصال Sidebar به React Router
- [ ] فعال کردن Navigation Links
- [ ] نمایش User Info در Header
- [ ] ساخت User Dropdown
- [ ] پیاده‌سازی Logout
- [ ] ProtectedRoute Component

**خروجی:** Navigation فعال ✅

---

## 🎯 Day 4: Dashboard

**⏰ زمان:** 2-3 ساعت

**تسک‌ها:**
- [ ] Fetch تعداد کلینیک‌ها → API
- [ ] Fetch تعداد پزشکان → API
- [ ] Fetch تعداد مقالات → API
- [ ] نمایش در Cards موجود
- [ ] Loading State
- [ ] Error Handling

**خروجی:** Dashboard با Data Real ✅

---

## 🎯 Day 5: Clinics CRUD

**⏰ زمان:** 3-4 ساعت

**تسک‌ها:**
- [ ] List Clinics → جدول Bootstrap
- [ ] Fetch داده‌ها از API
- [ ] Pagination
- [ ] فرم Create Clinic → Modal
- [ ] Submit به API
- [ ] فرم Edit Clinic
- [ ] Delete با Confirm

**خروجی:** Clinics Management ✅

---

## 🎯 Day 6: Doctors - List & View

**⏰ زمان:** 3-4 ساعت

**تسک‌ها:**
- [ ] List Doctors → Cards یا Table
- [ ] Fetch داده‌ها + فیلتر Clinic
- [ ] نمایش Rating Stars
- [ ] نمایش تعداد کلینیک‌ها
- [ ] صفحه Doctor Details
- [ ] نمایش Comments

**خروجی:** Doctors List ✅

---

## 🎯 Day 7: Doctors - Create & Edit

**⏰ زمان:** 4-5 ساعت

**تسک‌ها:**
- [ ] فرم Create Doctor
- [ ] Image Upload (React)
- [ ] Multi-select برای Clinics
- [ ] Skills Input (Tags)
- [ ] Submit به API (multipart/form-data)
- [ ] فرم Edit Doctor
- [ ] Preview Image

**خروجی:** Doctors CRUD ✅

---

## 🎯 Day 8: Articles

**⏰ زمان:** 4-5 ساعت

**تسک‌ها:**
- [ ] List Articles (Table)
- [ ] نمایش Draft/Published Badge
- [ ] فرم Create Article
- [ ] Cover Image Upload
- [ ] فرم Edit Article
- [ ] Toggle Published
- [ ] Delete

**خروجی:** Articles Management ✅

---

## 🎯 Day 9: Services

**⏰ زمان:** 3-4 ساعت

**تسک‌ها:**
- [ ] List Services
- [ ] فرم Create Service
- [ ] فیلدهای Price & Duration
- [ ] Image Upload
- [ ] Edit & Delete
- [ ] نمایش Tips

**خروجی:** Services Management ✅

---

## 🎯 Day 10: Comments

**⏰ زمان:** 2-3 ساعت

**تسک‌ها:**
- [ ] List Comments
- [ ] فیلتر (Doctor/Article/Service)
- [ ] نمایش Details
- [ ] Delete با Confirm
- [ ] نمایش User Info

**خروجی:** Comments Management ✅

---

## 🎯 Day 11: FAQ + Gallery

**⏰ زمان:** 4-5 ساعت

**تسک‌ها:**
- [ ] List FAQs
- [ ] Drag & Drop (SortableJS)
- [ ] فرم Create FAQ
- [ ] Toggle Published
- [ ] List Gallery → Grid
- [ ] Image Upload (Multiple)
- [ ] Preview Modal

**خروجی:** FAQ + Gallery ✅

---

## 🎯 Day 12: Settings + Insurance

**⏰ زمان:** 3-4 ساعت

**تسک‌ها:**
- [ ] Page Settings
- [ ] فرم تنظیمات عمومی
- [ ] Social Media Links
- [ ] Logo Upload
- [ ] Save Changes
- [ ] List Insurance
- [ ] CRUD Insurance

**خروجی:** Settings + Insurance ✅

---

## 🎯 Day 13-14: Public Site (اگر لازم باشد)

**⏰ زمان:** 6-8 ساعت

**تسک‌ها:**
- [ ] Homepage → Fetch داده‌ها
- [ ] Doctor List (Public)
- [ ] Doctor Details
- [ ] Article List
- [ ] Article Details
- [ ] Services Pages
- [ ] About & Contact

**خروجی:** Public Website ✅

---

## 📊 خلاصه سریع

| Day | Focus | Time |
|-----|-------|------|
| 1 | Setup + API Service | 3-4h |
| 2 | Authentication | 3-4h |
| 3 | Layout | 2-3h |
| 4 | Dashboard | 2-3h |
| 5 | Clinics CRUD | 3-4h |
| 6-7 | Doctors | 7-9h |
| 8 | Articles | 4-5h |
| 9 | Services | 3-4h |
| 10 | Comments | 2-3h |
| 11 | FAQ + Gallery | 4-5h |
| 12 | Settings | 3-4h |
| 13-14 | Public (Optional) | 6-8h |

**کل:** 40-60 ساعت در 10-14 روز

---

## 🚀 شروع کنید

### Step 1: Setup
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios
```

### Step 2: API Service
```javascript
// src/api/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true // برای Session
});

export default API;
```

### Step 3: Authentication
```javascript
// src/context/AuthContext.js
import { createContext, useContext } from 'react';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);
```

---

## ✅ Checklist هر روز

- [ ] Pull آخرین تغییرات
- [ ] Commit منظم (3-4 بار)
- [ ] تست همه Features
- [ ] بررسی Console Errors
- [ ] فایل پروژه Clean بماند

---

**موفق باشید! 🎯**

