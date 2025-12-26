# فایل‌های مایگریشن در Git

## تغییرات انجام شده

فایل‌های مایگریشن SQL به گیت اضافه شده‌اند تا بتوانید در هاست از آنها استفاده کنید.

### فایل‌های اضافه شده:

1. **`prisma/combined-migrations.sql`** - فایل ترکیبی همه مایگریشن‌ها
2. **`prisma/migrations/*/migration.sql`** - فایل‌های جداگانه هر مایگریشن

### تغییر در `.gitignore`:

خط `prisma/migrations/` از `.gitignore` حذف شد تا فایل‌های SQL مایگریشن در گیت قرار بگیرند.

---

## استفاده در هاست

### روش 1: استفاده از فایل ترکیبی (پیشنهادی)

```bash
# در هاست - بعد از pull
cd ~/tahadent/backend/prisma

# اجرای فایل SQL ترکیبی
mysql -u [username] -p [database_name] < combined-migrations.sql
```

### روش 2: استفاده از phpMyAdmin

1. فایل `combined-migrations.sql` را باز کنید
2. محتوای آن را کپی کنید
3. در phpMyAdmin، تب "SQL" را باز کنید
4. SQL را paste کنید و اجرا کنید

### روش 3: اجرای فایل‌ها یکی یکی

```bash
cd ~/tahadent/backend/prisma/migrations

mysql -u [username] -p [database_name] < 20251207110620_firts_mysql/migration.sql
mysql -u [username] -p [database_name] < 20251222105059_update_appointmend_init/migration.sql
# ... و بقیه
```

---

## مزایا

✅ **ساده‌تر** - نیازی به tar.gz نیست
✅ **قابل ردیابی** - تغییرات در گیت قابل مشاهده است
✅ **قابل استفاده مجدد** - می‌توانید دوباره استفاده کنید
✅ **بدون نیاز به Prisma CLI** - فقط MySQL نیاز است

---

## نکات مهم

1. ⚠️ **فایل‌های SQL را تغییر ندهید** مگر اینکه بدانید چه می‌کنید
2. ✅ **همیشه بکاپ بگیرید** قبل از اجرای مایگریشن‌ها
3. ✅ **ترتیب مهم است** - مایگریشن‌ها را به ترتیب اجرا کنید

---

## بعد از Pull در هاست

```bash
# Pull کردن تغییرات
git pull

# اجرای مایگریشن‌ها
cd prisma
mysql -u tahademt_user -p tahadent_db < combined-migrations.sql

# بررسی موفقیت
mysql -u [username] -p [database_name] -e "SHOW TABLES;"
```

