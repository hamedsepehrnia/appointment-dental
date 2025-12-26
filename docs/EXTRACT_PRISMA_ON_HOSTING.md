# راهنمای Extract کردن Prisma Client در هاست

## بعد از Pull کردن از Git

### مرحله 1: Extract کردن فایل

```bash
# برو به پوشه backend در هاست
cd ~/tahadent/backend  # یا مسیر پروژه شما

# Extract کردن فایل
tar -xzf prisma-client.tar.gz
```

### مرحله 2: بررسی فایل‌ها

```bash
# بررسی وجود Prisma Client
ls -la node_modules/.prisma/client

# باید فایل‌هایی مثل index.js, index.d.ts و ... را ببینید
```

### مرحله 3: اجرای Migrate

```bash
# فقط migrate را اجرا کنید (بدون generate)
npm run migrate:only
```

یا:

```bash
npm run prisma:migrate:deploy
```

---

## اگر خطا داد

### خطا: "Prisma Client not found"

```bash
# بررسی کنید که فایل‌ها extract شده‌اند
ls -la node_modules/.prisma/
ls -la node_modules/@prisma/

# اگر وجود ندارند، دوباره extract کنید
tar -xzf prisma-client.tar.gz
```

### خطا: "Permission denied"

```bash
# تغییر دسترسی
chmod -R 755 node_modules/.prisma
chmod -R 755 node_modules/@prisma
```

### خطا: "Database connection failed"

```bash
# بررسی .env
cat .env | grep DATABASE_URL

# تست اتصال
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

---

## دستورات کامل (کپی-پیست)

```bash
cd ~/tahadent/backend
tar -xzf prisma-client.tar.gz
ls -la node_modules/.prisma/client
npm run migrate:only
```

