# راهنمای تولید Prisma Client در محیط محلی و آپلود به هاست

## مشکل
حتی با افزایش RAM، تولید Prisma Client در هاست با خطا مواجه می‌شود.

## راه‌حل: تولید در محیط محلی و آپلود

این روش **100% کار می‌کند** و نیازی به RAM اضافی در هاست ندارد.

---

## مرحله 1: تولید Prisma Client در محیط محلی

### در کامپیوتر خودتان (محیط محلی):

```bash
# 1. برو به پوشه backend
cd /home/hamed/Desktop/dental/backend

# 2. مطمئن شو که .env فایل وجود دارد (یا از هاست کپی کن)
# اگر .env ندارید، از هاست دانلود کنید

# 3. تولید Prisma Client
npm run prisma:generate
```

**نکته:** اگر در محیط محلی هم خطا داد، مطمئن شوید که:
- Node.js نسخه 16+ نصب است
- `npm install` را اجرا کرده‌اید
- فضای دیسک کافی دارید

---

## مرحله 2: فشرده‌سازی فایل‌های تولید شده

### در محیط محلی:

```bash
# فشرده کردن فایل‌های Prisma Client
cd /home/hamed/Desktop/dental/backend
tar -czf prisma-client.tar.gz node_modules/.prisma node_modules/@prisma/client
```

این دستور یک فایل `prisma-client.tar.gz` ایجاد می‌کند که شامل:
- `node_modules/.prisma/` - فایل‌های generate شده Prisma
- `node_modules/@prisma/client/` - Prisma Client

---

## مرحله 3: آپلود به هاست

### روش 1: استفاده از FTP/SFTP

1. فایل `prisma-client.tar.gz` را به هاست آپلود کنید
2. در هاست، به پوشه پروژه بروید:

```bash
cd ~/tahadent  # یا مسیر پروژه شما
```

3. فایل را باز کنید:

```bash
tar -xzf prisma-client.tar.gz
```

### روش 2: استفاده از SCP (اگر دسترسی SSH دارید)

```bash
# از محیط محلی
scp prisma-client.tar.gz tahadent@your-server:/home/tahadent/tahadent/
```

سپس در هاست:

```bash
cd ~/tahadent
tar -xzf prisma-client.tar.gz
```

---

## مرحله 4: بررسی و اجرای Migrate

### در هاست:

```bash
# 1. بررسی وجود Prisma Client
ls -la node_modules/.prisma/client

# اگر فایل‌ها وجود دارند، ادامه دهید

# 2. اجرای فقط migrate (بدون generate)
npm run migrate:only
```

یا:

```bash
npm run prisma:migrate:deploy
```

---

## عیب‌یابی

### خطا: "Prisma Client not found"

- مطمئن شوید که فایل‌ها را درست آپلود کرده‌اید
- بررسی کنید که مسیر `node_modules/.prisma/client` وجود دارد
- اگر وجود ندارد، دوباره آپلود کنید

### خطا: "Permission denied"

```bash
# تغییر دسترسی فایل‌ها
chmod -R 755 node_modules/.prisma
chmod -R 755 node_modules/@prisma
```

### خطا: "Database connection failed"

- فایل `.env` را بررسی کنید
- `DATABASE_URL` را چک کنید
- اتصال به دیتابیس را تست کنید

---

## مزایای این روش

✅ **نیازی به RAM اضافی ندارد**
✅ **سریع‌تر است** (generate در محیط محلی سریع‌تر است)
✅ **مطمئن است** (100% کار می‌کند)
✅ **هزینه کمتر** (نیازی به خرید RAM اضافی نیست)

---

## نکات مهم

1. **بعد از هر تغییر در `schema.prisma`** باید دوباره generate کنید و آپلود کنید
2. **فایل‌های generate شده** را در `.gitignore` قرار دهید (اگر از git استفاده می‌کنید)
3. **بکاپ بگیرید** قبل از آپلود فایل‌های جدید

---

## دستورات سریع

```bash
# در محیط محلی
cd backend
npm run prisma:generate
tar -czf prisma-client.tar.gz node_modules/.prisma node_modules/@prisma/client

# آپلود prisma-client.tar.gz به هاست

# در هاست
cd ~/tahadent
tar -xzf prisma-client.tar.gz
npm run migrate:only
```

