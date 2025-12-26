# راهنمای سریع اجرای مایگریشن‌ها در هاست

## ✅ فایل‌ها Pull شدند!

حالا می‌توانید مایگریشن‌ها را اجرا کنید.

---

## روش 1: استفاده از فایل ترکیبی (پیشنهادی - ساده‌ترین)

### از طریق MySQL CLI:

```bash
# در هاست
cd ~/tahadent/backend/prisma

# اجرای فایل SQL ترکیبی
# [username] و [database_name] را با مقادیر واقعی جایگزین کنید
mysql -u [username] -p [database_name] < combined-migrations.sql
```

**مثال:**
```bash
mysql -u root -p appointment_dental < combined-migrations.sql
```

### از طریق phpMyAdmin:

1. وارد phpMyAdmin شوید
2. دیتابیس خود را انتخاب کنید
3. تب "SQL" را باز کنید
4. فایل `prisma/combined-migrations.sql` را باز کنید
5. محتوای آن را کپی کنید
6. در phpMyAdmin paste کنید
7. "Go" یا "اجرا" را بزنید

---

## روش 2: اجرای فایل‌ها یکی یکی (اگر خطا داد)

اگر فایل ترکیبی خطا داد، فایل‌ها را یکی یکی اجرا کنید:

```bash
cd ~/tahadent/backend/prisma/migrations

mysql -u [username] -p [database_name] < 20251207110620_firts_mysql/migration.sql
mysql -u [username] -p [database_name] < 20251222105059_update_appointmend_init/migration.sql
mysql -u [username] -p [database_name] < 20251222111546_sec_app/migration.sql
mysql -u [username] -p [database_name] < 20251222150759_beta/migration.sql
mysql -u [username] -p [database_name] < 20251222203753_final/migration.sql
mysql -u [username] -p [database_name] < 20251223195500_add_eitaa_social_media/migration.sql
mysql -u [username] -p [database_name] < 20251224185218_add_application_type_to_doctor_application/migration.sql
mysql -u [username] -p [database_name] < 20251224185951_add_become_nurse_content/migration.sql
```

---

## بررسی موفقیت

بعد از اجرای مایگریشن‌ها، بررسی کنید:

```bash
# بررسی وجود جداول
mysql -u [username] -p [database_name] -e "SHOW TABLES;"
```

یا در phpMyAdmin:
```sql
SHOW TABLES;
```

**باید جداولی مثل این‌ها را ببینید:**
- `users`
- `clinics`
- `doctors`
- `appointments`
- `articles`
- و ...

---

## اگر خطا داد

### خطا: "Table already exists"
- یعنی جدول قبلاً ایجاد شده است
- می‌توانید از آن خط SQL رد شوید
- یا اگر می‌خواهید دوباره ایجاد کنید، اول drop کنید (⚠️ مراقب باشید! داده‌ها پاک می‌شوند)

### خطا: "Duplicate column"
- یعنی ستون قبلاً اضافه شده است
- می‌توانید از آن خط SQL رد شوید

### خطا: "Unknown database"
- نام دیتابیس را بررسی کنید
- مطمئن شوید که دیتابیس وجود دارد

---

## بعد از اجرای موفق

```bash
# سرور را راه‌اندازی کنید
cd ~/tahadent/backend
npm start
```

یا:

```bash
npm run dev
```

---

## خلاصه دستورات

```bash
# 1. Pull (انجام شده ✅)
git pull

# 2. اجرای مایگریشن‌ها
cd prisma
mysql -u [username] -p [database_name] < combined-migrations.sql

# 3. بررسی
mysql -u [username] -p [database_name] -e "SHOW TABLES;"

# 4. راه‌اندازی سرور
cd ..
npm start
```

---

## نکات مهم

1. ✅ **همیشه بکاپ بگیرید** قبل از اجرای مایگریشن‌ها
2. ✅ **ترتیب مهم است** - اگر فایل‌ها را یکی یکی اجرا می‌کنید، به ترتیب اجرا کنید
3. ✅ **اگر خطا دیدید**، خطای دقیق را بررسی کنید
4. ✅ **بعد از اجرا**، بررسی کنید که جداول ایجاد شده‌اند

---

## موفق باشید! 🎉

اگر مشکلی پیش آمد، خطای دقیق را بفرستید تا بررسی کنم.

