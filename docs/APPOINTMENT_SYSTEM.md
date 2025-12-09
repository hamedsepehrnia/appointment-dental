# 📅 راهنمای کامل سیستم نوبت‌دهی - Frontend

این مستند راهنمای کامل استفاده از API سیستم نوبت‌دهی برای توسعه‌دهندگان فرانت‌اند است.

---

## 📋 فهرست مطالب

- [معرفی سیستم](#معرفی-سیستم)
- [فلوچارت فرآیند](#فلوچارت-فرآیند)
- [وضعیت‌های نوبت](#وضعیتهای-نوبت)
- [API Endpoints](#api-endpoints)
  - [ایجاد نوبت](#1-ایجاد-نوبت)
  - [نوبت‌های کاربر](#2-نوبتهای-کاربر-جاری)
  - [لیست نوبت‌ها (پنل ادمین)](#3-لیست-نوبتها-پنل-ادمین)
  - [دریافت یک نوبت](#4-دریافت-یک-نوبت)
  - [تأیید نوبت](#5-تأیید-نوبت)
  - [لغو نوبت](#6-لغو-نوبت)
  - [به‌روزرسانی نوبت](#7-بهروزرسانی-نوبت)
  - [آمار نوبت‌ها](#8-آمار-نوبتها)
- [API نوتیفیکیشن](#api-نوتیفیکیشن)
- [نمونه کدهای React](#نمونه-کدهای-react)
- [پیامک‌های سیستم](#پیامکهای-سیستم)
- [نکات مهم](#نکات-مهم)

---

## معرفی سیستم

سیستم نوبت‌دهی به کاربران اجازه می‌دهد برای خود یا دیگران نوبت رزرو کنند. منشی کلینیک می‌تواند نوبت‌ها را تأیید یا لغو کند و سیستم به صورت خودکار پیامک یادآوری ارسال می‌کند.

### ویژگی‌های کلیدی:
- ✅ رزرو نوبت با یا بدون انتخاب پزشک
- ✅ امکان رزرو برای شخص دیگر
- ✅ سیستم نوتیفیکیشن برای منشی
- ✅ پیامک خودکار در مراحل مختلف
- ✅ یادآوری ۲۴ ساعت و ۳۰ دقیقه قبل از نوبت

---

## فلوچارت فرآیند

```
┌─────────────────────────────────────────────────────────────────────┐
│                         فرآیند رزرو نوبت                            │
└─────────────────────────────────────────────────────────────────────┘

کاربر: کلیک روی "رزرو نوبت"
         │
         ▼
┌─────────────────────┐
│  انتخاب کلینیک      │  ◄── GET /api/clinics
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ پزشک انتخاب کنید؟   │
│   [بله]    [خیر]   │
└─────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
[بله]      [خیر]
    │         │
    ▼         │
┌─────────────────────┐
│  انتخاب پزشک       │  ◄── GET /api/doctors?clinicId=xxx
└─────────────────────┘
         │
         ├─────────┘
         ▼
┌─────────────────────┐
│ انتخاب تاریخ و ساعت │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  آیا برای خودتان    │
│   رزرو می‌کنید؟     │
│   [بله]    [خیر]   │
└─────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
[بله]      [خیر]
    │         │
    │         ▼
    │    ┌─────────────────────┐
    │    │ ورود نام مراجع      │
    │    └─────────────────────┘
    │         │
    ├─────────┘
    ▼
┌─────────────────────┐
│   تأیید نهایی       │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  POST /api/appointments  │  ◄── ایجاد نوبت
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  پیامک به کاربر     │  ← "نوبت شما ثبت شد"
│  پیامک به منشی     │  ← "درخواست نوبت جدید"
│  نوتیفیکیشن پنل    │
└─────────────────────┘
         │
         ▼
    ┌─────────────────────────────────┐
    │        انتظار تأیید منشی        │
    │     status: APPROVED_BY_USER   │
    └─────────────────────────────────┘
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

---

## وضعیت‌های نوبت

| وضعیت | مقدار | توضیحات |
|-------|-------|---------|
| در انتظار بررسی | `PENDING` | (فعلاً استفاده نمی‌شود) |
| تأیید اولیه | `APPROVED_BY_USER` | نوبت توسط کاربر ثبت شده، منتظر تأیید منشی |
| تأیید نهایی | `FINAL_APPROVED` | نوبت توسط منشی تأیید شده |
| لغو شده | `CANCELED` | نوبت لغو شده (توسط کاربر یا منشی) |

### نمایش وضعیت در UI:

```javascript
const statusConfig = {
  PENDING: {
    label: 'در انتظار بررسی',
    color: 'gray',
    icon: 'clock'
  },
  APPROVED_BY_USER: {
    label: 'در انتظار تأیید منشی',
    color: 'yellow',
    icon: 'hourglass'
  },
  FINAL_APPROVED: {
    label: 'تأیید شده',
    color: 'green',
    icon: 'check-circle'
  },
  CANCELED: {
    label: 'لغو شده',
    color: 'red',
    icon: 'x-circle'
  }
};
```

---

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Headers مورد نیاز

```http
Content-Type: application/json
Cookie: dental.sid=<session-cookie>
X-CSRF-Token: <csrf-token>
```

> ⚠️ برای همه درخواست‌های POST, PATCH, DELETE نیاز به CSRF Token دارید.

---

### 1. ایجاد نوبت

کاربر لاگین شده می‌تواند نوبت جدید ایجاد کند.

```http
POST /api/appointments
```

#### Request Body

| فیلد | نوع | اجباری | توضیحات |
|------|-----|--------|---------|
| `clinicId` | UUID | ✅ | شناسه کلینیک |
| `doctorId` | UUID | ❌ | شناسه پزشک (اختیاری) |
| `appointmentDate` | ISO DateTime | ✅ | تاریخ و ساعت نوبت |
| `patientName` | String | ❌ | نام مراجع (اگر برای شخص دیگری است) |
| `notes` | String | ❌ | توضیحات اضافی |

#### نمونه درخواست

```json
{
  "clinicId": "550e8400-e29b-41d4-a716-446655440000",
  "doctorId": "550e8400-e29b-41d4-a716-446655440001",
  "appointmentDate": "2025-12-15T14:30:00.000Z",
  "patientName": "علی محمدی",
  "notes": "نیاز به پارکینگ دارم"
}
```

#### نمونه درخواست (بدون پزشک و برای خودم)

```json
{
  "clinicId": "550e8400-e29b-41d4-a716-446655440000",
  "appointmentDate": "2025-12-15T14:30:00.000Z"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "message": "نوبت با موفقیت ثبت شد و در انتظار تأیید منشی می‌باشد",
  "data": {
    "appointment": {
      "id": "uuid",
      "userId": "user-uuid",
      "clinicId": "clinic-uuid",
      "doctorId": "doctor-uuid",
      "appointmentDate": "2025-12-15T14:30:00.000Z",
      "patientName": "علی محمدی",
      "status": "APPROVED_BY_USER",
      "notes": "نیاز به پارکینگ دارم",
      "reminder24hSent": false,
      "reminder30mSent": false,
      "createdAt": "2025-12-09T10:00:00.000Z",
      "updatedAt": "2025-12-09T10:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "firstName": "محمد",
        "lastName": "احمدی",
        "phoneNumber": "989123456789",
        "gender": "MALE"
      },
      "clinic": {
        "id": "clinic-uuid",
        "name": "کلینیک طاها",
        "address": "تهران، خیابان ولیعصر",
        "phoneNumber": "02112345678"
      },
      "doctor": {
        "id": "doctor-uuid",
        "firstName": "رضا",
        "lastName": "کریمی"
      }
    }
  }
}
```

#### خطاهای احتمالی

| کد | پیام |
|----|------|
| 400 | اعتبارسنجی ناموفق (فیلدهای اجباری) |
| 401 | لطفاً ابتدا وارد شوید |
| 403 | CSRF token missing/invalid |
| 404 | کلینیک/پزشک یافت نشد |

---

### 2. نوبت‌های کاربر جاری

لیست نوبت‌های کاربر لاگین شده.

```http
GET /api/appointments/my
```

#### Query Parameters

| پارامتر | نوع | توضیحات |
|---------|-----|---------|
| `page` | Number | شماره صفحه (پیش‌فرض: 1) |
| `limit` | Number | تعداد در صفحه (پیش‌فرض: 10) |
| `status` | Enum | فیلتر وضعیت |

#### نمونه درخواست

```http
GET /api/appointments/my?page=1&limit=10&status=FINAL_APPROVED
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "appointmentDate": "2025-12-15T14:30:00.000Z",
        "patientName": null,
        "status": "FINAL_APPROVED",
        "notes": null,
        "clinic": {
          "id": "clinic-uuid",
          "name": "کلینیک طاها",
          "address": "تهران، خیابان ولیعصر",
          "phoneNumber": "02112345678"
        },
        "doctor": {
          "id": "doctor-uuid",
          "firstName": "رضا",
          "lastName": "کریمی"
        }
      }
    ]
  },
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### 3. لیست نوبت‌ها (پنل ادمین)

برای Admin و Secretary.

```http
GET /api/appointments
```

#### Query Parameters

| پارامتر | نوع | توضیحات |
|---------|-----|---------|
| `page` | Number | شماره صفحه |
| `limit` | Number | تعداد در صفحه |
| `status` | Enum | فیلتر وضعیت |
| `clinicId` | UUID | فیلتر کلینیک (فقط Admin) |
| `doctorId` | UUID | فیلتر پزشک |
| `fromDate` | ISO Date | از تاریخ |
| `toDate` | ISO Date | تا تاریخ |
| `search` | String | جستجو در نام، نام‌خانوادگی، شماره تلفن |

#### نمونه درخواست

```http
GET /api/appointments?status=APPROVED_BY_USER&fromDate=2025-12-01&toDate=2025-12-31&search=علی
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "appointmentDate": "2025-12-15T14:30:00.000Z",
        "patientName": "علی محمدی",
        "status": "APPROVED_BY_USER",
        "notes": null,
        "createdAt": "2025-12-09T10:00:00.000Z",
        "user": {
          "id": "user-uuid",
          "firstName": "محمد",
          "lastName": "احمدی",
          "phoneNumber": "989123456789",
          "gender": "MALE"
        },
        "clinic": {
          "id": "clinic-uuid",
          "name": "کلینیک طاها"
        },
        "doctor": {
          "id": "doctor-uuid",
          "firstName": "رضا",
          "lastName": "کریمی"
        }
      }
    ]
  },
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

> 📝 **نکته:** منشی فقط نوبت‌های کلینیک خودش را می‌بیند.

---

### 4. دریافت یک نوبت

```http
GET /api/appointments/:id
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": "uuid",
      "appointmentDate": "2025-12-15T14:30:00.000Z",
      "patientName": "علی محمدی",
      "status": "APPROVED_BY_USER",
      "notes": "نیاز به پارکینگ دارم",
      "reminder24hSent": false,
      "reminder30mSent": false,
      "createdAt": "2025-12-09T10:00:00.000Z",
      "updatedAt": "2025-12-09T10:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "firstName": "محمد",
        "lastName": "احمدی",
        "phoneNumber": "989123456789",
        "gender": "MALE",
        "nationalCode": "1234567890",
        "address": "تهران"
      },
      "clinic": {
        "id": "clinic-uuid",
        "name": "کلینیک طاها",
        "address": "تهران، خیابان ولیعصر",
        "phoneNumber": "02112345678"
      },
      "doctor": {
        "id": "doctor-uuid",
        "firstName": "رضا",
        "lastName": "کریمی",
        "profileImage": "/uploads/doctors/profile.jpg"
      }
    }
  }
}
```

---

### 5. تأیید نوبت

فقط Admin و Secretary می‌توانند نوبت را تأیید کنند.

```http
PATCH /api/appointments/:id/approve
```

#### Headers

```http
X-CSRF-Token: <csrf-token>
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "نوبت با موفقیت تأیید شد و پیامک به مراجع ارسال گردید",
  "data": {
    "appointment": {
      "id": "uuid",
      "status": "FINAL_APPROVED",
      // ... سایر فیلدها
    }
  }
}
```

#### خطاهای احتمالی

| کد | پیام |
|----|------|
| 400 | این نوبت قبلاً تأیید شده است |
| 400 | این نوبت لغو شده و قابل تأیید نیست |
| 403 | شما دسترسی به این نوبت ندارید |
| 404 | نوبت یافت نشد |

---

### 6. لغو نوبت

کاربر می‌تواند نوبت خودش را لغو کند. Admin و Secretary می‌توانند هر نوبتی را لغو کنند.

```http
PATCH /api/appointments/:id/cancel
```

#### Request Body (اختیاری)

```json
{
  "reason": "بیمار درخواست لغو داد"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "نوبت با موفقیت لغو شد",
  "data": {
    "appointment": {
      "id": "uuid",
      "status": "CANCELED",
      "notes": "دلیل لغو: بیمار درخواست لغو داد"
    }
  }
}
```

> 📝 **نکته:** اگر منشی نوبت را لغو کند، پیامک به مراجع ارسال می‌شود.

---

### 7. به‌روزرسانی نوبت

فقط Admin و Secretary.

```http
PATCH /api/appointments/:id
```

#### Request Body

```json
{
  "appointmentDate": "2025-12-16T15:00:00.000Z",
  "doctorId": "new-doctor-uuid",
  "patientName": "نام جدید",
  "notes": "توضیحات جدید"
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "نوبت با موفقیت به‌روزرسانی شد",
  "data": {
    "appointment": {
      // اطلاعات به‌روز شده
    }
  }
}
```

> ⚠️ **توجه:** اگر تاریخ تغییر کند، فلگ‌های یادآوری ریست می‌شوند.

---

### 8. آمار نوبت‌ها

برای داشبورد پنل ادمین.

```http
GET /api/appointments/stats
```

#### Response (200 OK)

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

---

## API نوتیفیکیشن

### 1. لیست نوتیفیکیشن‌ها

```http
GET /api/notifications?page=1&limit=20&read=false
```

#### Response

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "appointment_new",
        "title": "درخواست نوبت جدید",
        "message": "درخواست نوبت جدید از علی محمدی برای شنبه ۲۵ آذر ۱۴۰۴ ساعت ۱۴:۳۰",
        "link": "/admin/appointments/appointment-uuid",
        "read": false,
        "createdAt": "2025-12-09T10:00:00.000Z",
        "appointment": {
          "id": "appointment-uuid",
          "status": "APPROVED_BY_USER",
          "appointmentDate": "2025-12-15T14:30:00.000Z"
        },
        "clinic": {
          "id": "clinic-uuid",
          "name": "کلینیک طاها"
        }
      }
    ]
  },
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 2. تعداد نوتیفیکیشن‌های خوانده نشده

```http
GET /api/notifications/unread-count
```

#### Response

```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

### 3. خواندن یک نوتیفیکیشن

```http
PATCH /api/notifications/:id/read
```

### 4. خواندن همه نوتیفیکیشن‌ها

```http
PATCH /api/notifications/read-all
```

### 5. حذف نوتیفیکیشن

```http
DELETE /api/notifications/:id
```

---

## نمونه کدهای React

### Hook برای مدیریت نوبت‌ها

```typescript
// hooks/useAppointments.ts
import { useState } from 'react';
import api from '../utils/api';

interface CreateAppointmentData {
  clinicId: string;
  doctorId?: string;
  appointmentDate: string;
  patientName?: string;
  notes?: string;
}

export const useAppointments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAppointment = async (data: CreateAppointmentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/appointments', data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت نوبت');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMyAppointments = async (params?: { page?: number; status?: string }) => {
    setLoading(true);
    try {
      const response = await api.get('/appointments/my', { params });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id: string, reason?: string) => {
    setLoading(true);
    try {
      const response = await api.patch(`/appointments/${id}/cancel`, { reason });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createAppointment,
    getMyAppointments,
    cancelAppointment,
  };
};
```

### کامپوننت فرم رزرو نوبت

```tsx
// components/AppointmentForm.tsx
import { useState } from 'react';
import { useAppointments } from '../hooks/useAppointments';

interface Props {
  clinics: Array<{ id: string; name: string }>;
  doctors: Array<{ id: string; firstName: string; lastName: string }>;
  onSuccess: () => void;
}

export const AppointmentForm = ({ clinics, doctors, onSuccess }: Props) => {
  const { createAppointment, loading, error } = useAppointments();
  
  const [formData, setFormData] = useState({
    clinicId: '',
    doctorId: '',
    appointmentDate: '',
    patientName: '',
    isForOther: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createAppointment({
        clinicId: formData.clinicId,
        doctorId: formData.doctorId || undefined,
        appointmentDate: new Date(formData.appointmentDate).toISOString(),
        patientName: formData.isForOther ? formData.patientName : undefined,
      });
      
      onSuccess();
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}
      
      {/* انتخاب کلینیک */}
      <div>
        <label>کلینیک *</label>
        <select
          value={formData.clinicId}
          onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
          required
        >
          <option value="">انتخاب کنید</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name}
            </option>
          ))}
        </select>
      </div>

      {/* انتخاب پزشک (اختیاری) */}
      <div>
        <label>پزشک (اختیاری)</label>
        <select
          value={formData.doctorId}
          onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
        >
          <option value="">هر پزشکی</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              دکتر {doctor.firstName} {doctor.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* تاریخ و ساعت */}
      <div>
        <label>تاریخ و ساعت *</label>
        <input
          type="datetime-local"
          value={formData.appointmentDate}
          onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
          required
        />
      </div>

      {/* رزرو برای دیگری */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.isForOther}
            onChange={(e) => setFormData({ ...formData, isForOther: e.target.checked })}
          />
          رزرو برای شخص دیگر
        </label>
      </div>

      {formData.isForOther && (
        <div>
          <label>نام مراجع *</label>
          <input
            type="text"
            value={formData.patientName}
            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
            required
          />
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'در حال ثبت...' : 'ثبت نوبت'}
      </button>
    </form>
  );
};
```

### Hook برای نوتیفیکیشن‌ها

```typescript
// hooks/useNotifications.ts
import { useState, useEffect } from 'react';
import api from '../utils/api';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async (params?: { page?: number; read?: boolean }) => {
    try {
      const response = await api.get('/notifications', { params });
      setNotifications(response.data.data.notifications);
      return response.data;
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Polling هر 30 ثانیه
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    unreadCount,
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};
```

---

## پیامک‌های سیستم

### 1. پیامک ثبت نوبت (به مراجع)

```
[آقای/خانم] [نام] [نام‌خانوادگی] عزیز،
نوبت شما در کلینیک [کلینیک] با دکتر [پزشک] در ساعت [ساعت] روز [روز] [تاریخ] ثبت شد و در دست بررسی می‌باشد.
لطفاً تا تأیید نهایی صبر کنید.
```

> **توجه:** عنوان جنسیت بر اساس فیلد `gender` کاربر تعیین می‌شود:
> - `MALE` → آقای
> - `FEMALE` → خانم
> - `null/OTHER` → بدون عنوان

### 2. پیامک اطلاع‌رسانی (به منشی)

```
درخواست رزرو نوبت جدید

نام مراجع: [نام] [نام‌خانوادگی]
تاریخ: [روز] [تاریخ] ساعت [ساعت]
پزشک: [پزشک]
تلفن مراجع: [تلفن]

برای بررسی به پنل مراجعه کنید:
[لینک]
```

> **توجه:** اگر نوبت برای شخص دیگری گرفته شده باشد، `patientName` نمایش داده می‌شود. در غیر این صورت نام و نام‌خانوادگی کاربر رزرو کننده.

### 3. پیامک تأیید نوبت (به مراجع)

```
[نام] عزیز،
نوبت شما در کلینیک [کلینیک] با دکتر [پزشک] در ساعت [ساعت] روز [روز] [تاریخ] تأیید شد.
لطفاً در تاریخ و زمان مقرر به کلینیک مراجعه نمایید.
```

### 4. پیامک لغو نوبت (به مراجع)

```
[نام] عزیز،
متأسفانه نوبت شما در کلینیک [کلینیک] برای ساعت [ساعت] روز [روز] [تاریخ] لغو شد.
دلیل: [دلیل]
برای رزرو مجدد با کلینیک تماس بگیرید.
```

### 5. پیامک یادآوری ۲۴ ساعت قبل

```
[نام] عزیز،
یادآوری: نوبت شما در کلینیک [کلینیک] با دکتر [پزشک] فردا ساعت [ساعت] ([روز] [تاریخ]) می‌باشد.
آدرس: [آدرس]
لطفاً به موقع حضور داشته باشید.
```

### 6. پیامک یادآوری ۳۰ دقیقه قبل

```
[نام] عزیز،
یادآوری فوری: نوبت شما در کلینیک [کلینیک] با دکتر [پزشک] تا ۳۰ دقیقه دیگر (ساعت [ساعت]) است.
آدرس: [آدرس]
```

---

## نکات مهم

### 1. مدیریت تاریخ شمسی

تاریخ‌ها در دیتابیس به صورت میلادی (ISO) ذخیره می‌شوند. برای نمایش شمسی در فرانت:

```javascript
// استفاده از date-fns-jalali یا moment-jalaali
import { format } from 'date-fns-jalali';

const formatPersianDate = (date) => {
  return format(new Date(date), 'EEEE d MMMM yyyy ساعت HH:mm', { locale: faIR });
};
```

### 2. دسترسی‌ها

| عملیات | کاربر عادی | منشی | ادمین |
|--------|-----------|------|-------|
| ایجاد نوبت | ✅ | ✅ | ✅ |
| مشاهده نوبت خود | ✅ | ✅ | ✅ |
| مشاهده همه نوبت‌ها | ❌ | ✅ (کلینیک خود) | ✅ |
| تأیید نوبت | ❌ | ✅ | ✅ |
| لغو نوبت خود | ✅ | ✅ | ✅ |
| لغو نوبت دیگران | ❌ | ✅ | ✅ |
| ویرایش نوبت | ❌ | ✅ | ✅ |
| حذف نوبت | ❌ | ❌ | ✅ |

### 3. CSRF Token

قبل از هر درخواست POST/PATCH/DELETE:

```javascript
// دریافت CSRF Token
const { data } = await api.get('/auth/csrf-token');
const csrfToken = data.data.csrfToken;

// استفاده در درخواست
await api.post('/appointments', formData, {
  headers: { 'X-CSRF-Token': csrfToken }
});
```

### 4. Polling نوتیفیکیشن

برای real-time بودن نوتیفیکیشن‌ها، از polling استفاده کنید:

```javascript
useEffect(() => {
  const interval = setInterval(() => {
    fetchUnreadCount();
  }, 30000); // هر 30 ثانیه
  
  return () => clearInterval(interval);
}, []);
```

### 5. متغیر محیطی فرانت‌اند

```env
VITE_API_URL=http://localhost:3000/api
```

---

## خطاهای رایج

| کد | پیام | راه‌حل |
|----|------|--------|
| 400 | انتخاب کلینیک الزامی است | clinicId را ارسال کنید |
| 400 | تاریخ و ساعت نوبت الزامی است | appointmentDate را ارسال کنید |
| 401 | لطفاً ابتدا وارد شوید | کاربر باید لاگین کند |
| 403 | CSRF token missing | CSRF token را در header ارسال کنید |
| 403 | شما دسترسی به این نوبت ندارید | کاربر مجوز ندارد |
| 404 | کلینیک یافت نشد | clinicId نامعتبر است |
| 404 | پزشک یافت نشد | doctorId نامعتبر است |
| 404 | نوبت یافت نشد | appointment id نامعتبر است |

---

## تماس و پشتیبانی

برای سوالات فنی با تیم بک‌اند تماس بگیرید.

---

📅 آخرین به‌روزرسانی: آذر ۱۴۰۴

