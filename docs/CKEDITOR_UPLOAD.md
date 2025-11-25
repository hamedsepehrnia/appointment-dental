# 📸 راهنمای آپلود تصویر CKEditor

این مستندات نحوه استفاده از endpoint آپلود تصویر برای CKEditor را توضیح می‌دهد.

---

## 📋 فهرست مطالب

- [معرفی](#معرفی)
- [Endpoint](#endpoint)
- [نحوه استفاده در Frontend](#نحوه-استفاده-در-frontend)
- [مثال‌های کد](#مثال‌های-کد)
- [تنظیمات](#تنظیمات)
- [محدودیت‌ها](#محدودیت‌ها)
- [خطاها و راه‌حل‌ها](#خطاها-و-راه‌حل‌ها)

---

## 🎯 معرفی

این endpoint برای آپلود مستقیم تصاویر از CKEditor به سرور طراحی شده است. وقتی کاربر در CKEditor روی دکمه "Insert Image" کلیک می‌کند و تصویری را انتخاب می‌کند، این endpoint فایل را دریافت کرده و URL کامل تصویر را برمی‌گرداند.

### ویژگی‌ها

- ✅ **عمومی**: نیاز به authentication ندارد
- ✅ **ساده**: فقط یک POST request با فایل
- ✅ **سازگار با CKEditor**: فرمت پاسخ مطابق با استاندارد CKEditor
- ✅ **امن**: فقط فایل‌های تصویری مجاز (jpg, jpeg, png, webp)
- ✅ **محدودیت حجم**: حداکثر 5MB (قابل تنظیم)

---

## 🔗 Endpoint

### `POST /api/upload`

**URL کامل:** `http://localhost:4000/api/upload`

**Content-Type:** `multipart/form-data`

**Field Name:** `file`

**Response Format:**
```json
{
  "url": "http://localhost:4000/uploads/images/file-1234567890-987654321.jpg"
}
```

---

## 💻 نحوه استفاده در Frontend

### مرحله 1: ساخت Upload Adapter

در پروژه React یک فایل بسازید:

**`src/ckeditor/MyUploadAdapter.js`**

```javascript
export default class MyUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  // CKEditor automatically calls this method
  upload() {
    return this.loader.file.then(
      (file) =>
        new Promise((resolve, reject) => {
          const data = new FormData();
          data.append("file", file);

          fetch("http://localhost:4000/api/upload", {
            method: "POST",
            body: data,
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error(`Upload failed: ${res.statusText}`);
              }
              return res.json();
            })
            .then((response) => {
              resolve({
                default: response.url, // CKEditor needs { default: "image-url" }
              });
            })
            .catch((err) => {
              reject(err);
            });
        })
    );
  }

  abort() {
    // Optional: implement abort logic if needed
  }
}
```

### مرحله 2: ساخت Plugin

**`src/ckeditor/UploadPlugin.js`**

```javascript
import MyUploadAdapter from "./MyUploadAdapter";

export function UploadPlugin(editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
    return new MyUploadAdapter(loader);
  };
}
```

### مرحله 3: استفاده در CKEditor Component

```jsx
import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { UploadPlugin } from './ckeditor/UploadPlugin';

function MyEditor() {
  return (
    <CKEditor
      editor={ClassicEditor}
      data="<p>Hello from CKEditor!</p>"
      config={{
        extraPlugins: [UploadPlugin], // 👈 مهم: اضافه کردن پلاگین
      }}
      onChange={(event, editor) => {
        const data = editor.getData();
        console.log({ data });
      }}
    />
  );
}

export default MyEditor;
```

---

## 📝 مثال‌های کد

### مثال 1: استفاده با TypeScript

**`src/ckeditor/MyUploadAdapter.ts`**

```typescript
import { FileLoader } from '@ckeditor/ckeditor5-upload';

export default class MyUploadAdapter {
  private loader: FileLoader;

  constructor(loader: FileLoader) {
    this.loader = loader;
  }

  upload(): Promise<{ default: string }> {
    return this.loader.file.then(
      (file: File) =>
        new Promise((resolve, reject) => {
          const data = new FormData();
          data.append("file", file);

          fetch("http://localhost:4000/api/upload", {
            method: "POST",
            body: data,
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error(`Upload failed: ${res.statusText}`);
              }
              return res.json();
            })
            .then((response: { url: string }) => {
              resolve({
                default: response.url,
              });
            })
            .catch((err) => {
              reject(err);
            });
        })
    );
  }

  abort(): void {
    // Optional: implement abort logic
  }
}
```

### مثال 2: استفاده با Environment Variables

برای استفاده از URL داینامیک:

```javascript
// .env
REACT_APP_API_URL=http://localhost:4000

// MyUploadAdapter.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

fetch(`${API_URL}/api/upload`, {
  method: "POST",
  body: data,
})
```

### مثال 3: اضافه کردن Loading State

```javascript
export default class MyUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(
      (file) =>
        new Promise((resolve, reject) => {
          // Show loading indicator
          const data = new FormData();
          data.append("file", file);

          fetch("http://localhost:4000/api/upload", {
            method: "POST",
            body: data,
          })
            .then((res) => {
              if (!res.ok) {
                throw new Error(`Upload failed: ${res.statusText}`);
              }
              return res.json();
            })
            .then((response) => {
              // Hide loading indicator
              resolve({
                default: response.url,
              });
            })
            .catch((err) => {
              // Hide loading indicator
              // Show error message to user
              reject(err);
            });
        })
    );
  }

  abort() {}
}
```

---

## ⚙️ تنظیمات

### تنظیمات Backend

در فایل `.env` می‌توانید تنظیمات زیر را تغییر دهید:

```env
# حداکثر حجم فایل (به بایت)
MAX_FILE_SIZE=5242880  # 5MB

# مسیر ذخیره‌سازی فایل‌ها
UPLOAD_PATH=uploads
```

### تنظیمات Frontend

برای تغییر URL endpoint در Frontend:

```javascript
// استفاده از environment variable
const UPLOAD_ENDPOINT = process.env.REACT_APP_UPLOAD_URL || 'http://localhost:4000/api/upload';

fetch(UPLOAD_ENDPOINT, {
  method: "POST",
  body: data,
})
```

---

## 🚫 محدودیت‌ها

### فرمت‌های مجاز

- ✅ JPEG (`.jpg`, `.jpeg`)
- ✅ PNG (`.png`)
- ✅ WebP (`.webp`)

### محدودیت حجم

- **پیش‌فرض:** 5MB
- **قابل تنظیم:** از طریق `MAX_FILE_SIZE` در `.env`

### محدودیت‌های دیگر

- فقط فایل‌های تصویری مجاز هستند
- فایل‌های با فرمت‌های دیگر رد می‌شوند
- فایل‌های بزرگ‌تر از حد مجاز رد می‌شوند

---

## ❌ خطاها و راه‌حل‌ها

### خطای 400: "لطفاً یک تصویر انتخاب کنید"

**علت:** فایلی ارسال نشده است.

**راه‌حل:**
- مطمئن شوید که field name درست است: `file`
- مطمئن شوید که FormData به درستی ساخته شده است

### خطای 400: "نوع فایل نامعتبر است"

**علت:** فرمت فایل مجاز نیست.

**راه‌حل:**
- فقط از فرمت‌های jpg, jpeg, png, webp استفاده کنید
- مطمئن شوید که extension فایل درست است

### خطای 400: "حجم فایل بیش از حد مجاز است"

**علت:** فایل بزرگ‌تر از 5MB است.

**راه‌حل:**
- حجم فایل را کاهش دهید
- یا `MAX_FILE_SIZE` را در `.env` افزایش دهید

### خطای CORS

**علت:** Frontend و Backend روی domain/port متفاوت هستند.

**راه‌حل:**
- مطمئن شوید که origin فرانت‌اند در `ALLOWED_ORIGINS` در `.env` اضافه شده است:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

### تصویر آپلود می‌شود اما نمایش داده نمی‌شود

**علت:** URL برگشتی درست نیست یا فایل در مسیر درست ذخیره نشده.

**راه‌حل:**
- مطمئن شوید که static files در `server.js` به درستی تنظیم شده:
  ```javascript
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  ```
- بررسی کنید که فایل در `uploads/images/` ذخیره شده است
- URL برگشتی را در console بررسی کنید

---

## 🔍 تست Endpoint

### با cURL

```bash
curl -X POST http://localhost:4000/api/upload \
  -F "file=@/path/to/your/image.jpg"
```

### با Postman

1. Method: `POST`
2. URL: `http://localhost:4000/api/upload`
3. Body: `form-data`
4. Key: `file` (type: File)
5. Value: انتخاب فایل تصویری

### با JavaScript (Fetch API)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:4000/api/upload', {
  method: 'POST',
  body: formData,
})
  .then(res => res.json())
  .then(data => console.log('Uploaded:', data.url))
  .catch(err => console.error('Error:', err));
```

---

## 📁 ساختار فایل‌ها

```
backend/
├── src/
│   ├── controllers/
│   │   └── uploadController.js      ← Controller آپلود
│   ├── routes/
│   │   ├── uploadRoutes.js          ← Route definition
│   │   └── index.js                 ← Route registration
│   └── middlewares/
│       └── upload.js                 ← Multer configuration
├── uploads/
│   └── images/                      ← فایل‌های آپلود شده
└── docs/
    └── CKEDITOR_UPLOAD.md           ← این فایل
```

---

## 🔐 امنیت

### نکات امنیتی

1. **اعتبارسنجی فایل:** فقط فایل‌های تصویری مجاز هستند
2. **بررسی MIME Type:** هم extension و هم MIME type بررسی می‌شود
3. **محدودیت حجم:** جلوگیری از آپلود فایل‌های بزرگ
4. **نام فایل یکتا:** هر فایل با نام یکتا ذخیره می‌شود

### توصیه‌های امنیتی برای Production

1. **Authentication:** در production می‌توانید authentication اضافه کنید
2. **Rate Limiting:** محدود کردن تعداد درخواست‌های آپلود
3. **Virus Scanning:** اسکن فایل‌ها برای ویروس
4. **CDN:** استفاده از CDN برای سرو فایل‌های استاتیک

---

## 📚 منابع بیشتر

- [CKEditor 5 Documentation](https://ckeditor.com/docs/ckeditor5/latest/)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Express Static Files](https://expressjs.com/en/starter/static-files.html)

---

## ✅ چک‌لیست پیاده‌سازی

- [ ] Upload Adapter در Frontend ساخته شده
- [ ] Upload Plugin در Frontend ساخته شده
- [ ] CKEditor با پلاگین پیکربندی شده
- [ ] Endpoint در Backend تست شده
- [ ] فولدر `uploads/images/` وجود دارد
- [ ] CORS به درستی تنظیم شده
- [ ] Environment variables تنظیم شده‌اند

---

## 🆘 پشتیبانی

اگر مشکلی پیش آمد:

1. لاگ‌های سرور را بررسی کنید (`logs/error.log`)
2. Response error را در browser console بررسی کنید
3. Network tab در DevTools را بررسی کنید
4. مطمئن شوید که سرور در حال اجرا است

---

**آخرین به‌روزرسانی:** 2024

