#!/usr/bin/env node

/**
 * اسکریپت اجرای فقط مایگریشن (بدون generate)
 * برای مواقعی که Prisma Client قبلاً generate شده است
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
  log('اجرای مایگریشن (بدون generate)', 'bright');
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

  // بررسی وجود Prisma Client
  const prismaClientPath = path.join(__dirname, '../../node_modules/.prisma/client');
  if (!fs.existsSync(prismaClientPath)) {
    logError('Prisma Client یافت نشد!');
    logWarning('ابتدا باید Prisma Client را generate کنید:');
    logInfo('1. در محیط محلی: npm run prisma:generate');
    logInfo('2. آپلود node_modules/.prisma/ به هاست');
    logInfo('3. یا استفاده از: npm run migrate:hosting');
    process.exit(1);
  }

  logSuccess('Prisma Client یافت شد.\n');

  try {
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
    log('3. اجرای دستی مایگریشن‌ها از طریق phpMyAdmin', 'cyan');
    log('='.repeat(50) + '\n', 'yellow');
    
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`خطای غیرمنتظره: ${error.message}`);
  console.error(error);
  process.exit(1);
});

