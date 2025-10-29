# 🚀 راهنمای سریع - React Integration

## ⚡ شروع سریع (Quick Start)

### HTML/CSS آماده است ✅
### فقط نیاز به React + API Integration ⚡

---

## 📅 برنامه 2 هفته‌ای

### 🟢 هفته اول (5 روز)
```
Day 1: Setup + API Service            (3-4h)
Day 2: Authentication                 (3-4h)  
Day 3: Layout & Navigation           (2-3h)
Day 4: Dashboard                      (2-3h)
Day 5: Clinics CRUD                   (3-4h)
```

### 🟡 هفته دوم (5-9 روز)
```
Day 6:  Doctors List                  (3-4h)
Day 7:  Doctors CRUD                  (4-5h)
Day 8:  Articles                       (4-5h)
Day 9:  Services                       (3-4h)
Day 10: Comments                       (2-3h)
Day 11: FAQ + Gallery                  (4-5h)
Day 12: Settings                       (3-4h)
Day 13-14: Public Site (Optional)     (6-8h)
```

---

## 🎯 استراتژی کار

### 1️⃣ Setup (Day 1)
```bash
# Create React App
npm create vite@latest frontend -- --template react
cd frontend
npm install axios

# ساختار
src/
  api/       # API calls
  context/   # Context
  pages/     # Pages
```

### 2️⃣ Authentication (Day 2)
- Login → `/auth/login`
- Request OTP → `/auth/request-otp`
- Verify OTP → `/auth/verify-otp`
- Session Management

### 3️⃣ Dashboard (Day 3-4)
- Layout آماده
- فقط Fetch Data
- نمایش در Cards

### 4️⃣ CRUD Operations (Day 5-12)
برای هر Entity:
- List → Fetch from API
- Create → POST to API
- Edit → PATCH to API
- Delete → DELETE to API

---

## 💡 Template Code

### API Service
```javascript
// src/api/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true
});

export default api;
```

### Auth Context
```javascript
// src/context/AuthContext.js
import { createContext, useState } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### استفاده در کامپوننت
```javascript
import { useState, useEffect } from 'react';
import api from '../api/api';

function ClinicsList() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await api.get('/clinics');
        setClinics(res.data.data.clinics);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {clinics.map(clinic => (
        <div key={clinic.id}>{clinic.name}</div>
      ))}
    </div>
  );
}
```

---

## 📋 Checklist هر Entity

برای هر CRUD Page:
- [ ] ایجاد صفحه
- [ ] اتصال به API
- [ ] Fetch Data
- [ ] نمایش در HTML آماده
- [ ] Create Form
- [ ] Edit Form
- [ ] Delete با Confirm
- [ ] Loading States
- [ ] Error Handling

---

## ⏰ تخمین زمانی

| Module | Time |
|--------|------|
| Setup | 3-4h |
| Auth | 3-4h |
| Dashboard | 2-3h |
| Clinics | 3-4h |
| Doctors | 7-9h |
| Articles | 4-5h |
| Services | 3-4h |
| Comments | 2-3h |
| FAQ | 2-3h |
| Gallery | 2-3h |
| Settings | 2-3h |
| Insurance | 2-3h |
| Public | 6-8h (Optional) |

**کل: 40-60 ساعت**

---

## 🎯 Focus

### اولویت 1 (Critical):
✅ Authentication  
✅ Dashboard  
✅ Clinics  
✅ Doctors  

### اولویت 2 (Important):
✅ Articles  
✅ Services  
✅ Settings  

### اولویت 3 (Nice to Have):
✅ FAQ  
✅ Gallery  
✅ Comments  
✅ Public Site  

---

## 💰 قیمت مجدد

### فقط React Integration:
```
حداقل: 15M - 20M تومان
منطقی: 20M - 30M تومان
Senior: 30M - 40M تومان
```

### با Backend:
```
Full-Stack: 45M - 65M تومان
```

---

## 🚀 شروع کنید!

1. **FRONTEND_TODO_React.md** را باز کنید
2. Day 1 را شروع کنید
3. هر روز یک Module
4. Progress را Track کنید

**موفق باشید! 💪**

