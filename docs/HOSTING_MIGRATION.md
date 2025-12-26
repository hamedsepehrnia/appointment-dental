# راهنمای مایگریشن در هاست (حل مشکل Memory Error)

## مشکل
هنگام اجرای مایگریشن در هاست، خطای حافظه (Memory Error) رخ می‌دهد.

## راه‌حل‌ها

### روش ۱: استفاده از اسکریپت بهینه‌شده (پیشنهادی)

```bash
npm run migrate:hosting
```

این اسکریپت:
- از `prisma migrate deploy` استفاده می‌کند (بهینه‌تر برای production)
- حافظه Node.js را به 2GB افزایش می‌دهد
- خطاها را به صورت واضح نمایش می‌دهد

### روش ۲: استفاده مستقیم از دستور Prisma

```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run prisma:migrate:deploy
```

یا:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npx prisma migrate deploy
```

### روش ۳: اجرای دستی SQL فایل‌ها

اگر روش‌های بالا کار نکرد، می‌توانید مایگریشن‌ها را به صورت دستی اجرا کنید:

1. فایل‌های SQL مایگریشن در مسیر زیر قرار دارند:
   ```
   backend/prisma/migrations/[نام-مایگریشن]/migration.sql
   ```

2. محتوای هر فایل `migration.sql` را کپی کنید

3. در phpMyAdmin یا MySQL CLI، SQL را اجرا کنید

**ترتیب اجرای مایگریشن‌ها:**
```
1. 20251207110620_firts_mysql
2. 20251222105059_update_appointmend_init
3. 20251222111546_sec_app
4. 20251222150759_beta
5. 20251222203753_final
6. 20251223195500_add_eitaa_social_media
7. 20251224185218_add_application_type_to_doctor_application
8. 20251224185951_add_become_nurse_content
```

### روش ۴: افزایش حافظه بیشتر

اگر هاست شما اجازه می‌دهد، حافظه را بیشتر کنید:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run migrate:hosting
```

یا:

```bash
NODE_OPTIONS="--max-old-space-size=8192" npx prisma migrate deploy
```

## نکات مهم

### تفاوت `migrate dev` و `migrate deploy`

- **`prisma migrate dev`**: برای محیط توسعه
  - مایگریشن جدید ایجاد می‌کند
  - حافظه بیشتری مصرف می‌کند
  - برای production مناسب نیست

- **`prisma migrate deploy`**: برای محیط production
  - فقط مایگریشن‌های موجود را اجرا می‌کند
  - بهینه‌تر و سریع‌تر است
  - برای هاست مناسب است

### قبل از مایگریشن

1. ✅ فایل `.env` را بررسی کنید
2. ✅ `DATABASE_URL` را تنظیم کنید
3. ✅ اتصال به دیتابیس را تست کنید
4. ✅ از دیتابیس بکاپ بگیرید

### بعد از مایگریشن

1. ✅ Prisma Client را generate کنید:
   ```bash
   npm run prisma:generate
   ```

2. ✅ وضعیت مایگریشن را بررسی کنید:
   ```bash
   npx prisma migrate status
   ```

## عیب‌یابی

### خطا: "Out of memory"
- حافظه را افزایش دهید (روش ۴)
- یا از روش ۳ (اجرای دستی) استفاده کنید

### خطا: "Connection refused"
- `DATABASE_URL` را بررسی کنید
- اتصال به دیتابیس را تست کنید

### خطا: "Migration already applied"
- این خطا طبیعی است و به معنای اجرای قبلی مایگریشن است
- می‌توانید نادیده بگیرید

## دستورات مفید

```bash
# بررسی وضعیت مایگریشن‌ها
npx prisma migrate status

# تولید Prisma Client
npm run prisma:generate

# مشاهده وضعیت دیتابیس
npx prisma studio
```

## پشتیبانی

اگر مشکل حل نشد:
1. لاگ خطا را ذخیره کنید
2. نسخه Node.js و Prisma را بررسی کنید
3. از روش ۳ (اجرای دستی SQL) استفاده کنید

