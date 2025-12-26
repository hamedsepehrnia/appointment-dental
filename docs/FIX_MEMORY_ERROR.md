# راهنمای حل مشکل Out of Memory در Prisma Generate

## مشکل
هنگام اجرای `npm run migrate:hosting` خطای زیر رخ می‌دهد:
```
RangeError: WebAssembly.Instance(): Out of memory: Cannot allocate Wasm memory for new instance
```

این خطا به دلیل کمبود حافظه RAM در سرور هاست است.

---

## راه‌حل‌ها (به ترتیب اولویت)

### ✅ راه‌حل 1: تولید Prisma Client در محیط محلی (پیشنهادی)

این روش برای هاست‌های با حافظه محدود بهترین است:

#### مرحله 1: تولید Prisma Client در محیط محلی

```bash
# در محیط محلی (کامپیوتر خودتان)
cd backend
npm run prisma:generate
```

#### مرحله 2: آپلود فایل‌های تولید شده به هاست

فایل‌های زیر را از محیط محلی به هاست آپلود کنید:

```
node_modules/.prisma/
node_modules/@prisma/client/
```

**نکته:** می‌توانید فقط این دو پوشه را فشرده کنید و آپلود کنید:

```bash
# در محیط محلی
cd backend
tar -czf prisma-client.tar.gz node_modules/.prisma node_modules/@prisma/client
```

سپس در هاست:

```bash
# در هاست
cd tahadent
tar -xzf prisma-client.tar.gz
```

#### مرحله 3: اجرای فقط مایگریشن در هاست

```bash
npm run migrate:only
```

یا:

```bash
npm run prisma:migrate:deploy
```

---

### ✅ راه‌حل 2: افزایش حافظه Node.js

اگر هاست شما اجازه می‌دهد، حافظه را افزایش دهید:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run migrate:hosting
```

یا:

```bash
NODE_OPTIONS="--max-old-space-size=8192" npm run migrate:hosting
```

**نکته:** این روش فقط در صورتی کار می‌کند که هاست شما حداقل 4-8GB RAM داشته باشد.

---

### ✅ راه‌حل 3: استفاده از اسکریپت بهبود یافته

اسکریپت `migrateHosting.js` بهبود یافته است و:
- ابتدا بررسی می‌کند که آیا Prisma Client قبلاً generate شده یا نه
- اگر generate نشده، با حافظه بیشتر تلاش می‌کند
- در صورت خطا، راهنمایی‌های مفید نمایش می‌دهد

```bash
npm run migrate:hosting
```

---

### ✅ راه‌حل 4: اجرای دستی مایگریشن‌ها

اگر هیچکدام از روش‌های بالا کار نکرد، می‌توانید مایگریشن‌ها را به صورت دستی اجرا کنید:

#### مرحله 1: پیدا کردن فایل‌های SQL

فایل‌های مایگریشن در مسیر زیر قرار دارند:
```
backend/prisma/migrations/[نام-مایگریشن]/migration.sql
```

#### مرحله 2: اجرای SQL در phpMyAdmin یا MySQL CLI

ترتیب اجرای مایگریشن‌ها:
1. `20251207110620_firts_mysql/migration.sql`
2. `20251222105059_update_appointmend_init/migration.sql`
3. `20251222111546_sec_app/migration.sql`
4. `20251222150759_beta/migration.sql`
5. `20251222203753_final/migration.sql`
6. `20251223195500_add_eitaa_social_media/migration.sql`
7. `20251224185218_add_application_type_to_doctor_application/migration.sql`
8. `20251224185951_add_become_nurse_content/migration.sql`

#### مرحله 3: تولید Prisma Client (بعد از اجرای مایگریشن‌ها)

بعد از اجرای دستی مایگریشن‌ها، باید Prisma Client را generate کنید (از راه‌حل 1 استفاده کنید).

---

## دستورات مفید

### بررسی وضعیت Prisma Client

```bash
# بررسی وجود Prisma Client
ls -la node_modules/.prisma/client
```

### بررسی وضعیت مایگریشن‌ها

```bash
npx prisma migrate status
```

### تولید Prisma Client (اگر حافظه کافی دارید)

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run prisma:generate
```

### اجرای فقط مایگریشن (بدون generate)

```bash
npm run migrate:only
```

---

## توصیه نهایی

**برای هاست‌های با حافظه محدود (کمتر از 2GB RAM):**

1. ✅ از راه‌حل 1 استفاده کنید (تولید در محیط محلی)
2. ✅ فایل‌های generate شده را آپلود کنید
3. ✅ فقط migrate را اجرا کنید

**برای هاست‌های با حافظه کافی (بیش از 4GB RAM):**

1. ✅ از راه‌حل 2 استفاده کنید (افزایش حافظه)
2. ✅ یا از اسکریپت بهبود یافته استفاده کنید

---

## عیب‌یابی

### خطا: "Prisma Client یافت نشد"

- Prisma Client را در محیط محلی generate کنید
- فایل‌های generate شده را آپلود کنید

### خطا: "Connection refused"

- `DATABASE_URL` را در فایل `.env` بررسی کنید
- اتصال به دیتابیس را تست کنید

### خطا: "Migration already applied"

- این خطا طبیعی است و به معنای اجرای قبلی مایگریشن است
- می‌توانید نادیده بگیرید

---

## پشتیبانی

اگر مشکل حل نشد:
1. لاگ خطا را ذخیره کنید
2. نسخه Node.js و Prisma را بررسی کنید
3. از راه‌حل 4 (اجرای دستی) استفاده کنید

