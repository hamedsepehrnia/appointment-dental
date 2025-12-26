# راهنمای اجرای دستی مایگریشن‌ها (بدون Prisma CLI)

## مشکل
حتی با وجود Prisma Client، اجرای `prisma migrate deploy` به دلیل کمبود حافظه خطا می‌دهد.

## راه‌حل: اجرای دستی SQL

این روش نیاز به Prisma CLI ندارد و فقط از MySQL استفاده می‌کند.

---

## روش 1: اجرای از طریق phpMyAdmin (ساده‌تر)

### مرحله 1: باز کردن phpMyAdmin
1. وارد پنل هاست شوید
2. phpMyAdmin را باز کنید
3. دیتابیس خود را انتخاب کنید

### مرحله 2: اجرای فایل‌های SQL

فایل‌های SQL در مسیر زیر قرار دارند:
```
backend/prisma/migrations/[نام-مایگریشن]/migration.sql
```

**ترتیب اجرا (خیلی مهم!):**

1. `20251207110620_firts_mysql/migration.sql` - اولین مایگریشن
2. `20251222105059_update_appointmend_init/migration.sql`
3. `20251222111546_sec_app/migration.sql`
4. `20251222150759_beta/migration.sql`
5. `20251222203753_final/migration.sql`
6. `20251223195500_add_eitaa_social_media/migration.sql`
7. `20251224185218_add_application_type_to_doctor_application/migration.sql`
8. `20251224185951_add_become_nurse_content/migration.sql`

### مرحله 3: اجرای هر فایل

برای هر فایل:
1. فایل `migration.sql` را باز کنید
2. محتوای آن را کپی کنید
3. در phpMyAdmin، تب "SQL" را باز کنید
4. SQL را paste کنید
5. "Go" یا "اجرا" را بزنید

**نکته:** اگر خطای "Table already exists" دیدید، یعنی آن جدول قبلاً ایجاد شده و می‌توانید از آن مایگریشن رد شوید.

---

## روش 2: اجرای از طریق MySQL CLI (برای کاربران پیشرفته)

```bash
# اتصال به MySQL
mysql -u [username] -p [database_name]

# سپس برای هر مایگریشن:
source /path/to/backend/prisma/migrations/20251207110620_firts_mysql/migration.sql;
source /path/to/backend/prisma/migrations/20251222105059_update_appointmend_init/migration.sql;
# ... و بقیه
```

---

## روش 3: استفاده از اسکریپت ترکیبی (پیشنهادی)

یک فایل SQL ترکیبی ایجاد شده که همه مایگریشن‌ها را به ترتیب اجرا می‌کند:

```bash
# در هاست
cd ~/tahadent/backend
mysql -u [username] -p [database_name] < prisma/combined-migrations.sql
```

---

## بررسی وضعیت مایگریشن‌ها

بعد از اجرای مایگریشن‌ها، می‌توانید بررسی کنید:

```sql
-- بررسی وجود جدول _prisma_migrations
SHOW TABLES LIKE '_prisma_migrations';

-- اگر وجود دارد، بررسی کنید که کدام مایگریشن‌ها اجرا شده‌اند
SELECT * FROM _prisma_migrations;
```

---

## عیب‌یابی

### خطا: "Table already exists"

این خطا طبیعی است اگر جدول قبلاً ایجاد شده باشد. می‌توانید:
- از آن مایگریشن رد شوید
- یا جدول را drop کنید و دوباره اجرا کنید (⚠️ مراقب باشید! داده‌ها پاک می‌شوند)

### خطا: "Duplicate column"

یعنی ستون قبلاً اضافه شده است. می‌توانید از آن خط SQL رد شوید.

### خطا: "Unknown database"

مطمئن شوید که نام دیتابیس درست است و دیتابیس وجود دارد.

---

## نکات مهم

1. ✅ **همیشه بکاپ بگیرید** قبل از اجرای مایگریشن‌ها
2. ✅ **ترتیب مهم است** - مایگریشن‌ها را به ترتیب اجرا کنید
3. ✅ **اگر خطا داد**، خطای دقیق را بررسی کنید
4. ✅ **بعد از اجرا**، بررسی کنید که جداول ایجاد شده‌اند

---

## بعد از اجرای مایگریشن‌ها

بعد از اجرای موفق مایگریشن‌ها:

1. ✅ Prisma Client قبلاً extract شده است (از tar.gz)
2. ✅ مایگریشن‌ها اجرا شده‌اند
3. ✅ حالا می‌توانید سرور را راه‌اندازی کنید:

```bash
npm start
```

یا:

```bash
npm run dev
```

---

## خلاصه

1. ✅ Prisma Client extract شده (از tar.gz)
2. ✅ مایگریشن‌ها را به صورت دستی اجرا کنید (از phpMyAdmin یا MySQL CLI)
3. ✅ سرور را راه‌اندازی کنید

این روش **100% کار می‌کند** و نیاز به Prisma CLI ندارد!

