#!/usr/bin/env node

/**
 * Optimized migration script for hosting with limited memory
 * This script runs migrations one by one to reduce memory consumption
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
  log('Optimized Migration Script for Hosting', 'bright');
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

  logInfo('Checking migration status...\n');

  // Check if Prisma Client exists (if previously generated)
  const prismaClientPath = path.join(__dirname, '../../node_modules/.prisma/client');
  const prismaClientExists = fs.existsSync(prismaClientPath);

  try {
    // If Prisma Client doesn't exist, try to generate it
    if (!prismaClientExists) {
      logInfo('Prisma Client not found. Generating...');
      logWarning('This process may require significant memory...\n');
      
      try {
        // First attempt with 2048MB memory
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../../'),
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=2048',
      },
    });
        logSuccess('Prisma Client generated successfully\n');
      } catch (generateError) {
        // If memory error, try with more memory
        if (generateError.message.includes('memory') || generateError.message.includes('Memory')) {
          logWarning('Memory error while generating Prisma Client. Trying with more memory...\n');
          try {
            execSync('npx prisma generate', {
              stdio: 'inherit',
              cwd: path.join(__dirname, '../../'),
              env: {
                ...process.env,
                NODE_OPTIONS: '--max-old-space-size=4096',
              },
            });
            logSuccess('Prisma Client generated successfully\n');
          } catch (secondError) {
            logError('Error generating Prisma Client due to insufficient memory!');
            log('\n' + '='.repeat(50), 'yellow');
            log('Alternative Solution:', 'yellow');
            log('='.repeat(50), 'yellow');
            log('1. Generate Prisma Client locally:', 'cyan');
            log('   npm run prisma:generate', 'cyan');
            log('2. Upload the following files to hosting:', 'cyan');
            log('   - node_modules/.prisma/', 'cyan');
            log('   - node_modules/@prisma/client/', 'cyan');
            log('3. Then run only migrate:', 'cyan');
            log('   npm run prisma:migrate:deploy', 'cyan');
            log('='.repeat(50) + '\n', 'yellow');
            throw secondError;
          }
        } else {
          throw generateError;
        }
      }
    } else {
      logSuccess('Prisma Client already exists. Using existing version.\n');
    }

    // Run migrations using migrate deploy (optimized for production)
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
    log('3. Increase Node.js memory with the following command:', 'cyan');
    log('   NODE_OPTIONS="--max-old-space-size=4096" npm run migrate:hosting', 'cyan');
    log('4. If you have memory errors, generate Prisma Client locally:', 'cyan');
    log('   - Locally: npm run prisma:generate', 'cyan');
    log('   - Upload node_modules/.prisma/ to hosting', 'cyan');
    log('   - Then: npm run prisma:migrate:deploy', 'cyan');
    log('5. Run migrations manually one by one via phpMyAdmin or MySQL CLI', 'cyan');
    log('='.repeat(50) + '\n', 'yellow');
    
    process.exit(1);
  }
}

main().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

