# چک‌لیست نهایی راه‌اندازی در هاست

## ✅ مراحل انجام شده

1. ✅ Prisma Client extract شده (از tar.gz)
2. ✅ مایگریشن‌ها اجرا شده‌اند
3. ✅ همه جداول ایجاد شده‌اند

---

## بررسی نهایی

### 1. بررسی Prisma Client

```bash
# در هاست
cd ~/tahadent/backend
ls -la node_modules/.prisma/client
```

باید فایل‌هایی مثل `index.js`, `index.d.ts` و ... را ببینید.

### 2. بررسی جداول (انجام شده ✅)

```bash
mysql -u tahadent_user -p tahadent_db -e "SHOW TABLES;"
```

همه جداول وجود دارند:
- ✅ users
- ✅ clinics
- ✅ doctors
- ✅ appointments
- ✅ articles
- ✅ services
- ✅ و ...

### 3. بررسی فایل .env

```bash
# بررسی وجود .env
ls -la .env

# بررسی DATABASE_URL
cat .env | grep DATABASE_URL
```

---

## راه‌اندازی سرور

### روش 1: Production Mode

```bash
cd ~/tahadent/backend
npm start
```

### روش 2: Development Mode (اگر نیاز دارید)

```bash
npm run dev
```

---

## بررسی کارکرد سرور

بعد از راه‌اندازی، بررسی کنید:

1. **بررسی لاگ‌ها:**
   - باید پیام "Server is running on port 4000" را ببینید
   - یا پورت دیگری که در `.env` تنظیم کرده‌اید

2. **تست API:**
   ```bash
   curl http://localhost:4000/api/health
   ```

3. **تست Frontend:**
   - اگر `SERVE_MODE=combined` است، frontend هم باید کار کند
   - آدرس: `http://your-domain:4000`

---

## ایجاد کاربر Admin (اگر نیاز دارید)

```bash
npm run create:admin
```

---

## مشکلات احتمالی

### خطا: "Prisma Client not found"

```bash
# بررسی کنید که Prisma Client extract شده است
ls -la node_modules/.prisma/client

# اگر وجود ندارد، دوباره extract کنید
cd ~/tahadent/backend
tar -xzf prisma-client.tar.gz
```

### خطا: "Database connection failed"

```bash
# بررسی DATABASE_URL
cat .env | grep DATABASE_URL

# تست اتصال
mysql -u tahadent_user -p tahadent_db -e "SELECT 1;"
```

### خطا: "Port already in use"

```bash
# بررسی پورت
lsof -i :4000

# یا پورت را در .env تغییر دهید
```

---

## خلاصه دستورات

```bash
# 1. بررسی Prisma Client
ls -la node_modules/.prisma/client

# 2. بررسی جداول (انجام شده ✅)
mysql -u tahadent_user -p tahadent_db -e "SHOW TABLES;"

# 3. راه‌اندازی سرور
npm start

# 4. بررسی کارکرد
curl http://localhost:4000/api/health
```

---

## موفق باشید! 🎉

اگر مشکلی پیش آمد، خطای دقیق را بفرستید تا بررسی کنم.

