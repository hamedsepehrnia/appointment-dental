#!/usr/bin/env node

/**
 * Script to run migrations only (without generate)
 * For cases where Prisma Client has already been generated
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
  log('Run Migrations Only (without generate)', 'bright');
  log('='.repeat(50) + '\n', 'bright');

  // Check if .env file exists
  const envPath = path.join(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) {
    logError('.env file not found!');
    logInfo('Please create .env file first: npm run create:env');
    process.exit(1);
  }

  // Check if DATABASE_URL exists
  require('dotenv').config({ path: envPath });
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL is not set in .env file!');
    process.exit(1);
  }

  // Check if Prisma Client exists
  const prismaClientPath = path.join(__dirname, '../../node_modules/.prisma/client');
  if (!fs.existsSync(prismaClientPath)) {
    logError('Prisma Client not found!');
    logWarning('You must generate Prisma Client first:');
    logInfo('1. Locally: npm run prisma:generate');
    logInfo('2. Upload node_modules/.prisma/ to hosting');
    logInfo('3. Or use: npm run migrate:hosting');
    process.exit(1);
  }

  logSuccess('Prisma Client found.\n');

  try {
    logInfo('Running migrations...');
    logWarning('This process may take a few minutes...\n');

    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../../'),
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=2048',
      },
    });

    logSuccess('\n✓ All migrations executed successfully!');
    log('\n' + '='.repeat(50), 'green');
    log('Migration completed successfully', 'green');
    log('='.repeat(50) + '\n', 'green');

  } catch (error) {
    logError('\n✗ Error running migrations!');
    logError(`Error message: ${error.message}`);
    
    log('\n' + '='.repeat(50), 'yellow');
    log('Suggested Solutions:', 'yellow');
    log('='.repeat(50), 'yellow');
    log('1. Check database connection', 'cyan');
    log('2. Verify DATABASE_URL in .env file', 'cyan');
    log('3. Run migrations manually via phpMyAdmin', 'cyan');
    log('='.repeat(50) + '\n', 'yellow');
    
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

