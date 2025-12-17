# 📋 مستندات تغییرات سیستم ساعات کاری پزشکان

## 🎯 هدف تغییرات

در سیستم قبلی، هر پزشک فقط یک مجموعه ساعات کاری داشت. اما چون یک پزشک می‌تواند در **چندین کلینیک** فعالیت داشته باشد و در هر کلینیک ساعات کاری **متفاوتی** داشته باشد، ساختار تغییر کرد.

---

## 🔄 تغییرات اصلی

### قبل (سیستم قدیمی) ❌

```
Doctor
├── id
├── firstName
├── lastName
├── workingDays: { saturday: "14:00-18:00", ... }  ← یک ساعت کاری برای همه کلینیک‌ها
└── clinicIds: ["clinic-1", "clinic-2"]
```

### بعد (سیستم جدید) ✅

```
Doctor
├── id
├── firstName
├── lastName
└── clinics: [
      {
        clinicId: "clinic-1",
        workingDays: { saturday: "14:00-18:00" }  ← ساعات کاری در کلینیک 1
      },
      {
        clinicId: "clinic-2", 
        workingDays: { tuesday: "18:00-21:00" }   ← ساعات کاری در کلینیک 2
      }
    ]
```

---

## 📡 تغییرات API

### 1️⃣ ایجاد پزشک جدید

**Endpoint:** `POST /api/doctors`

#### فرمت قدیمی (هنوز پشتیبانی می‌شود اما توصیه نمی‌شود):
```json
{
  "firstName": "علی",
  "lastName": "محمدی",
  "university": "علوم پزشکی تهران",
  "medicalLicenseNo": "12345",
  "clinicIds": ["clinic-uuid-1", "clinic-uuid-2"],
  "workingDays": {
    "saturday": "14:00-18:00",
    "sunday": "09:00-13:00"
  }
}
```
⚠️ **مشکل:** با این فرمت، ساعات کاری ذخیره نمی‌شود چون فیلد `workingDays` از مدل Doctor حذف شده.

#### فرمت جدید (توصیه شده):
```json
{
  "firstName": "علی",
  "lastName": "محمدی",
  "university": "علوم پزشکی تهران",
  "medicalLicenseNo": "12345",
  "skills": ["دندانپزشکی عمومی", "ایمپلنت"],
  "shortDescription": "متخصص دندانپزشکی با ۱۰ سال سابقه",
  "biography": "...",
  "clinics": [
    {
      "clinicId": "550e8400-e29b-41d4-a716-446655440001",
      "workingDays": {
        "saturday": "14:00-18:00",
        "sunday": "09:00-13:00",
        "monday": "14:00-18:00"
      }
    },
    {
      "clinicId": "550e8400-e29b-41d4-a716-446655440002",
      "workingDays": {
        "tuesday": "18:00-21:00",
        "wednesday": "18:00-21:00",
        "thursday": "18:00-21:00"
      }
    }
  ]
}
```

---

### 2️⃣ ویرایش پزشک

**Endpoint:** `PATCH /api/doctors/:id`

#### درخواست:
```json
{
  "firstName": "علی",
  "clinics": [
    {
      "clinicId": "550e8400-e29b-41d4-a716-446655440001",
      "workingDays": {
        "saturday": "10:00-14:00",
        "sunday": "10:00-14:00"
      }
    }
  ]
}
```

⚠️ **توجه:** اگر `clinics` ارسال شود، تمام ارتباطات قبلی پاک شده و جایگزین می‌شود.

---

### 3️⃣ دریافت لیست پزشکان

**Endpoint:** `GET /api/doctors`

#### پاسخ:
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id": "doctor-uuid-1",
        "firstName": "علی",
        "lastName": "محمدی",
        "slug": "ali-mohammadi",
        "profileImage": "/uploads/doctors/image.jpg",
        "shortDescription": "متخصص دندانپزشکی",
        "university": "علوم پزشکی تهران",
        "biography": "...",
        "skills": ["دندانپزشکی عمومی", "ایمپلنت"],
        "medicalLicenseNo": "12345",
        "clinics": [
          {
            "id": "doctor-clinic-uuid-1",
            "clinicId": "clinic-uuid-1",
            "workingDays": {
              "saturday": "14:00-18:00",
              "sunday": "09:00-13:00"
            },
            "clinic": {
              "id": "clinic-uuid-1",
              "name": "کلینیک دندانپزشکی تهران"
            }
          },
          {
            "id": "doctor-clinic-uuid-2",
            "clinicId": "clinic-uuid-2",
            "workingDays": {
              "tuesday": "18:00-21:00",
              "wednesday": "18:00-21:00"
            },
            "clinic": {
              "id": "clinic-uuid-2",
              "name": "کلینیک دندانپزشکی کرج"
            }
          }
        ],
        "_count": {
          "comments": 5
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-20T14:45:00.000Z"
      }
    ]
  },
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 4️⃣ دریافت یک پزشک

**Endpoint:** `GET /api/doctors/:identifier`

(identifier می‌تواند `id` یا `slug` باشد)

#### پاسخ:
```json
{
  "success": true,
  "data": {
    "doctor": {
      "id": "doctor-uuid-1",
      "firstName": "علی",
      "lastName": "محمدی",
      "slug": "ali-mohammadi",
      "profileImage": "/uploads/doctors/image.jpg",
      "shortDescription": "متخصص دندانپزشکی",
      "university": "علوم پزشکی تهران",
      "biography": "توضیحات کامل پزشک...",
      "skills": ["دندانپزشکی عمومی", "ایمپلنت"],
      "medicalLicenseNo": "12345",
      "clinics": [
        {
          "id": "doctor-clinic-uuid-1",
          "clinicId": "clinic-uuid-1",
          "workingDays": {
            "saturday": "14:00-18:00",
            "sunday": "09:00-13:00",
            "monday": "14:00-18:00"
          },
          "clinic": {
            "id": "clinic-uuid-1",
            "name": "کلینیک دندانپزشکی تهران",
            "address": "تهران، خیابان ولیعصر",
            "phoneNumber": "02112345678"
          }
        },
        {
          "id": "doctor-clinic-uuid-2",
          "clinicId": "clinic-uuid-2",
          "workingDays": {
            "tuesday": "18:00-21:00",
            "wednesday": "18:00-21:00"
          },
          "clinic": {
            "id": "clinic-uuid-2",
            "name": "کلینیک دندانپزشکی کرج",
            "address": "کرج، میدان آزادی",
            "phoneNumber": "02634567890"
          }
        }
      ],
      "comments": [...],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z"
    },
    "stats": {
      "totalComments": 5,
      "averageRating": "4.5"
    }
  }
}
```

---

## 📝 ساختار workingDays

فیلد `workingDays` یک آبجکت JSON است با کلیدهای روزهای هفته به انگلیسی:

| کلید | روز |
|------|-----|
| `saturday` | شنبه |
| `sunday` | یکشنبه |
| `monday` | دوشنبه |
| `tuesday` | سه‌شنبه |
| `wednesday` | چهارشنبه |
| `thursday` | پنج‌شنبه |
| `friday` | جمعه |

### فرمت مقدار ساعت:
```
"HH:MM-HH:MM"
```

#### مثال‌ها:
```json
{
  "saturday": "09:00-13:00",      // از ۹ صبح تا ۱ ظهر
  "sunday": "14:00-18:00",        // از ۲ بعدازظهر تا ۶ عصر
  "monday": "09:00-12:00,14:00-18:00"  // دو شیفت (صبح و عصر)
}
```

### اگر روزی تعطیل است:
- آن کلید را نفرستید
- یا مقدار `null` یا `""` بدهید

```json
{
  "saturday": "09:00-13:00",
  "sunday": null,           // یکشنبه تعطیل
  "monday": "",             // دوشنبه تعطیل
  // سه‌شنبه تا جمعه هم ارسال نشده = تعطیل
}
```

---

## 🖥️ تغییرات فرانت‌اند

### فرم ایجاد/ویرایش پزشک

#### قبلاً:
```jsx
const [clinicIds, setClinicIds] = useState([]);
const [workingDays, setWorkingDays] = useState({});

// Submit
const data = {
  ...formData,
  clinicIds,
  workingDays
};
```

#### الان:
```jsx
const [clinics, setClinics] = useState([]);
// هر آیتم: { clinicId: string, workingDays: object }

// اضافه کردن کلینیک
const addClinic = (clinicId) => {
  setClinics([...clinics, { clinicId, workingDays: {} }]);
};

// تغییر ساعات کاری برای یک کلینیک
const updateClinicWorkingDays = (clinicId, workingDays) => {
  setClinics(clinics.map(c => 
    c.clinicId === clinicId ? { ...c, workingDays } : c
  ));
};

// Submit
const data = {
  ...formData,
  clinics
};
```

---

### نمایش ساعات کاری در صفحه پزشک

#### قبلاً:
```jsx
<div>
  <h3>ساعات کاری</h3>
  {Object.entries(doctor.workingDays || {}).map(([day, hours]) => (
    <p key={day}>{dayNames[day]}: {hours}</p>
  ))}
</div>
```

#### الان:
```jsx
<div>
  {doctor.clinics.map(doctorClinic => (
    <div key={doctorClinic.id}>
      <h3>ساعات کاری در {doctorClinic.clinic.name}</h3>
      {Object.entries(doctorClinic.workingDays || {}).map(([day, hours]) => (
        hours && <p key={day}>{dayNames[day]}: {hours}</p>
      ))}
    </div>
  ))}
</div>
```

---

## 🎨 پیشنهاد UI

### فرم ویرایش پزشک:

```
┌─────────────────────────────────────────────────┐
│  اطلاعات پزشک                                    │
│  ├── نام: [علی        ]                         │
│  ├── نام خانوادگی: [محمدی    ]                  │
│  └── ...                                        │
├─────────────────────────────────────────────────┤
│  کلینیک‌ها و ساعات کاری                          │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 🏥 کلینیک دندانپزشکی تهران    [حذف]     │    │
│  │ ┌─────────────────────────────────────┐ │    │
│  │ │ شنبه:     [14:00] - [18:00]         │ │    │
│  │ │ یکشنبه:   [09:00] - [13:00]         │ │    │
│  │ │ دوشنبه:   [14:00] - [18:00]         │ │    │
│  │ │ سه‌شنبه:  [ تعطیل ]                  │ │    │
│  │ │ ...                                 │ │    │
│  │ └─────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 🏥 کلینیک دندانپزشکی کرج      [حذف]     │    │
│  │ ┌─────────────────────────────────────┐ │    │
│  │ │ شنبه:     [ تعطیل ]                  │ │    │
│  │ │ یکشنبه:   [ تعطیل ]                  │ │    │
│  │ │ سه‌شنبه:  [18:00] - [21:00]         │ │    │
│  │ │ چهارشنبه: [18:00] - [21:00]         │ │    │
│  │ │ ...                                 │ │    │
│  │ └─────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [+ افزودن کلینیک جدید]                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔗 ارتباط با سیستم نوبت‌دهی

وقتی کاربر می‌خواهد نوبت بگیرد:

1. اول **کلینیک** را انتخاب می‌کند
2. لیست پزشکان آن کلینیک نمایش داده می‌شود
3. برای هر پزشک، **ساعات کاری همان کلینیک** را نشان بدهید

```jsx
// گرفتن ساعات کاری پزشک در کلینیک انتخاب شده
const getWorkingDaysForClinic = (doctor, clinicId) => {
  const doctorClinic = doctor.clinics.find(c => c.clinicId === clinicId);
  return doctorClinic?.workingDays || null;
};

// استفاده
const selectedClinicId = "clinic-uuid-1";
const workingDays = getWorkingDaysForClinic(doctor, selectedClinicId);
```

---

## ⚠️ نکات مهم

1. **سازگاری با فرمت قدیمی:** فرمت `clinicIds` هنوز کار می‌کند اما ساعات کاری ذخیره نمی‌شود.

2. **حذف کلینیک:** اگر `clinics` را ارسال کنید، همه ارتباطات قبلی پاک شده و جایگزین می‌شود.

3. **کلینیک بدون ساعت کاری:** می‌توانید کلینیکی را بدون `workingDays` اضافه کنید:
   ```json
   { "clinicId": "...", "workingDays": null }
   ```

4. **فیلتر پزشکان:** API فیلتر `clinicId` هنوز کار می‌کند:
   ```
   GET /api/doctors?clinicId=clinic-uuid-1
   ```

---

## 📅 تاریخ تغییرات

- **نسخه 2.0.0** - ۱۳۹۴/۰۹/۲۶
  - انتقال `workingDays` از مدل `Doctor` به `DoctorClinic`
  - اضافه شدن فرمت جدید `clinics` در API
  - پشتیبانی از ساعات کاری جداگانه برای هر کلینیک

---

## ❓ سوالات متداول

### آیا باید همه فرم‌ها را تغییر بدهم؟
بله، فرم ایجاد و ویرایش پزشک باید آپدیت شود تا از فرمت جدید `clinics` استفاده کند.

### آیا داده‌های قبلی از بین رفته؟
ساعات کاری قبلی که در مدل Doctor ذخیره شده بود، در migration حذف شد. باید دوباره وارد شود.

### آیا می‌توانم فقط کلینیک اضافه کنم بدون ساعت کاری؟
بله، `workingDays` اختیاری است و می‌تواند `null` باشد.

