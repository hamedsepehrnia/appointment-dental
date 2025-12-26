#!/usr/bin/env node

/**
 * اسکریپت مایگریشن بهینه‌شده برای هاست‌های با حافظه محدود
 * این اسکریپت مایگریشن‌ها را یکی یکی اجرا می‌کند تا مصرف حافظه کاهش یابد
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function main() {
  log('\n' + '='.repeat(50), 'bright');
  log('اسکریپت مایگریشن بهینه‌شده برای هاست', 'bright');
  log('='.repeat(50) + '\n', 'bright');

  // بررسی وجود فایل .env
  const envPath = path.join(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) {
    logError('فایل .env یافت نشد!');
    logInfo('لطفاً ابتدا فایل .env را ایجاد کنید: npm run create:env');
    process.exit(1);
  }

  // بررسی وجود DATABASE_URL
  require('dotenv').config({ path: envPath });
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL در فایل .env تنظیم نشده است!');
    process.exit(1);
  }

  logInfo('در حال بررسی وضعیت مایگریشن‌ها...\n');

  // بررسی وجود Prisma Client (اگر قبلاً generate شده باشد)
  const prismaClientPath = path.join(__dirname, '../../node_modules/.prisma/client');
  const prismaClientExists = fs.existsSync(prismaClientPath);

  try {
    // اگر Prisma Client وجود ندارد، سعی می‌کنیم آن را generate کنیم
    if (!prismaClientExists) {
      logInfo('Prisma Client یافت نشد. در حال تولید...');
      logWarning('این فرآیند ممکن است حافظه زیادی نیاز داشته باشد...\n');
      
      try {
        // تلاش اول با حافظه 2048MB
        execSync('npx prisma generate', {
          stdio: 'inherit',
          cwd: path.join(__dirname, '../../'),
          env: {
            ...process.env,
            NODE_OPTIONS: '--max-old-space-size=2048',
          },
        });
        logSuccess('Prisma Client با موفقیت تولید شد\n');
      } catch (generateError) {
        // اگر خطای حافظه بود، با حافظه بیشتر تلاش می‌کنیم
        if (generateError.message.includes('memory') || generateError.message.includes('Memory')) {
          logWarning('خطای حافظه در تولید Prisma Client. تلاش با حافظه بیشتر...\n');
          try {
            execSync('npx prisma generate', {
              stdio: 'inherit',
              cwd: path.join(__dirname, '../../'),
              env: {
                ...process.env,
                NODE_OPTIONS: '--max-old-space-size=4096',
              },
            });
            logSuccess('Prisma Client با موفقیت تولید شد\n');
          } catch (secondError) {
            logError('خطا در تولید Prisma Client به دلیل کمبود حافظه!');
            log('\n' + '='.repeat(50), 'yellow');
            log('راه‌حل جایگزین:', 'yellow');
            log('='.repeat(50), 'yellow');
            log('1. Prisma Client را در محیط محلی تولید کنید:', 'cyan');
            log('   npm run prisma:generate', 'cyan');
            log('2. فایل‌های زیر را به هاست آپلود کنید:', 'cyan');
            log('   - node_modules/.prisma/', 'cyan');
            log('   - node_modules/@prisma/client/', 'cyan');
            log('3. سپس فقط migrate را اجرا کنید:', 'cyan');
            log('   npm run prisma:migrate:deploy', 'cyan');
            log('='.repeat(50) + '\n', 'yellow');
            throw secondError;
          }
        } else {
          throw generateError;
        }
      }
    } else {
      logSuccess('Prisma Client قبلاً تولید شده است. از نسخه موجود استفاده می‌شود.\n');
    }

    // اجرای مایگریشن با استفاده از migrate deploy (بهینه‌تر برای production)
    logInfo('در حال اجرای مایگریشن‌ها...');
    logWarning('این فرآیند ممکن است چند دقیقه طول بکشد...\n');

    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../../'),
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=2048',
      },
    });

    logSuccess('\n✓ تمام مایگریشن‌ها با موفقیت اجرا شدند!');
    log('\n' + '='.repeat(50), 'green');
    log('مایگریشن با موفقیت انجام شد', 'green');
    log('='.repeat(50) + '\n', 'green');

  } catch (error) {
    logError('\n✗ خطا در اجرای مایگریشن!');
    logError(`پیام خطا: ${error.message}`);
    
    log('\n' + '='.repeat(50), 'yellow');
    log('راه‌حل‌های پیشنهادی:', 'yellow');
    log('='.repeat(50), 'yellow');
    log('1. بررسی اتصال به دیتابیس', 'cyan');
    log('2. بررسی صحت DATABASE_URL در فایل .env', 'cyan');
    log('3. افزایش حافظه Node.js با دستور زیر:', 'cyan');
    log('   NODE_OPTIONS="--max-old-space-size=4096" npm run migrate:hosting', 'cyan');
    log('4. اگر خطای حافظه دارید، Prisma Client را در محیط محلی تولید کنید:', 'cyan');
    log('   - در محیط محلی: npm run prisma:generate', 'cyan');
    log('   - آپلود node_modules/.prisma/ به هاست', 'cyan');
    log('   - سپس: npm run prisma:migrate:deploy', 'cyan');
    log('5. اجرای دستی مایگریشن‌ها یکی یکی از طریق phpMyAdmin یا MySQL CLI', 'cyan');
    log('='.repeat(50) + '\n', 'yellow');
    
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`خطای غیرمنتظره: ${error.message}`);
  console.error(error);
  process.exit(1);
});

