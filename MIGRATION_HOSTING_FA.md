# حل مشکل Memory Error در مایگریشن هاست

## مشکل
هنگام اجرای مایگریشن در هاست، خطای حافظه (Memory Error) رخ می‌دهد.

## راه‌حل سریع

### روش ۱: استفاده از اسکریپت بهینه‌شده (پیشنهادی)

```bash
npm run migrate:hosting
```

این اسکریپت به صورت خودکار:
- از `prisma migrate deploy` استفاده می‌کند (بهینه‌تر از `migrate dev`)
- حافظه Node.js را به 2GB افزایش می‌دهد
- خطاها را به صورت واضح نمایش می‌دهد

### روش ۲: دستور مستقیم با افزایش حافظه

```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run prisma:migrate:deploy
```

یا برای حافظه بیشتر:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npx prisma migrate deploy
```

## تفاوت مهم

❌ **اشتباه (برای هاست):**
```bash
npm run prisma:migrate  # این برای development است و حافظه زیادی می‌خورد
```

✅ **درست (برای هاست):**
```bash
npm run migrate:hosting  # یا
npm run prisma:migrate:deploy
```

## اگر باز هم خطا داد

### روش ۳: اجرای دستی SQL

اگر روش‌های بالا کار نکرد، می‌توانید فایل‌های SQL را به صورت دستی اجرا کنید:

1. به مسیر زیر بروید:
   ```
   backend/prisma/migrations/
   ```

2. فایل‌های `migration.sql` را به ترتیب زیر اجرا کنید:
   - `20251207110620_firts_mysql/migration.sql`
   - `20251222105059_update_appointmend_init/migration.sql`
   - `20251222111546_sec_app/migration.sql`
   - `20251222150759_beta/migration.sql`
   - `20251222203753_final/migration.sql`
   - `20251223195500_add_eitaa_social_media/migration.sql`
   - `20251224185218_add_application_type_to_doctor_application/migration.sql`
   - `20251224185951_add_become_nurse_content/migration.sql`

3. محتوای هر فایل را در phpMyAdmin یا MySQL CLI اجرا کنید

## بعد از مایگریشن

حتماً Prisma Client را generate کنید:

```bash
npm run prisma:generate
```

## بررسی وضعیت

برای بررسی اینکه مایگریشن‌ها اجرا شده‌اند:

```bash
npx prisma migrate status
```

## نکات مهم

1. ✅ همیشه قبل از مایگریشن از دیتابیس بکاپ بگیرید
2. ✅ فایل `.env` و `DATABASE_URL` را بررسی کنید
3. ✅ در هاست از `migrate deploy` استفاده کنید، نه `migrate dev`

## دستورات جدید اضافه شده

- `npm run migrate:hosting` - اسکریپت بهینه‌شده برای هاست
- `npm run prisma:migrate:deploy` - مایگریشن production
- `npm run prisma:migrate:hosting` - با افزایش حافظه

برای اطلاعات بیشتر به فایل `docs/HOSTING_MIGRATION.md` مراجعه کنید.

