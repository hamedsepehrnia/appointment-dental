#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Helper function for colored output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function printHeader(text) {
  console.log(`\n${colors.cyan}${colors.bright}--- ${text} ---${colors.reset}`);
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

async function main() {
  console.log(`
${colors.bright}${colors.blue}========================================${colors.reset}
${colors.bright}  Environment Configuration Generator${colors.reset}
${colors.bright}${colors.blue}========================================${colors.reset}
`);

  // 1. Ask if production or development
  printHeader('Environment Selection');
  console.log(`
  ${colors.yellow}1${colors.reset}. Development
  ${colors.yellow}2${colors.reset}. Production
`);
  
  let envChoice;
  while (true) {
    envChoice = await question('Enter your choice (1 or 2): ');
    if (envChoice === '1' || envChoice === '2') break;
    console.log(`${colors.red}Invalid choice. Please enter 1 or 2.${colors.reset}`);
  }
  
  let NODE_ENV, SERVE_MODE, SMS_LOG_ONLY;
  
  if (envChoice === '1') {
    // Development environment
    NODE_ENV = 'development';
    SERVE_MODE = 'combined';
    SMS_LOG_ONLY = 'true';
    printSuccess('Development environment selected');
    console.log(`  NODE_ENV: ${NODE_ENV}`);
    console.log(`  SERVE_MODE: ${SERVE_MODE}`);
    console.log(`  SMS_LOG_ONLY: ${SMS_LOG_ONLY} (OTP codes will be logged, not sent via SMS)`);
  } else {
    // Production environment
    NODE_ENV = 'production';
    SERVE_MODE = 'combined';
    SMS_LOG_ONLY = 'false';
    printSuccess('Production environment selected');
    console.log(`  NODE_ENV: ${NODE_ENV}`);
    console.log(`  SERVE_MODE: ${SERVE_MODE}`);
    console.log(`  SMS_LOG_ONLY: ${SMS_LOG_ONLY} (Real SMS will be sent)`);
  }

  // 2. Ask for database credentials
  printHeader('Database Configuration');
  
  let dbUsername;
  while (true) {
    dbUsername = await question('Database username: ');
    if (dbUsername.trim()) break;
    console.log(`${colors.red}Username cannot be empty.${colors.reset}`);
  }
  
  let dbPassword;
  while (true) {
    dbPassword = await question('Database password: ');
    if (dbPassword.trim()) break;
    console.log(`${colors.red}Password cannot be empty.${colors.reset}`);
  }
  
  let dbName;
  while (true) {
    dbName = await question('Database name: ');
    if (dbName.trim()) break;
    console.log(`${colors.red}Database name cannot be empty.${colors.reset}`);
  }
  
  let dbHost;
  while (true) {
    dbHost = await question('Database host (default: localhost): ');
    if (!dbHost.trim()) dbHost = 'localhost';
    break;
  }
  
  let dbPort;
  while (true) {
    dbPort = await question('Database port (default: 5432): ');
    if (!dbPort.trim()) dbPort = '5432';
    break;
  }
  
  const DATABASE_URL = `postgresql://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  printSuccess('Database configuration set');

  // 3. Generate random session secret
  printHeader('Session Configuration');
  const SESSION_SECRET = crypto.randomBytes(64).toString('hex');
  printSuccess('Session secret generated (128 character random string)');
  
  // 4. Default session max age (30 days in milliseconds)
  const SESSION_MAX_AGE = '2592000000';
  console.log(`  SESSION_MAX_AGE: ${SESSION_MAX_AGE} (30 days)`);

  // 5. Ask for Kavenegar SMS service
  printHeader('SMS Service (Kavenegar)');
  
  let KAVENEGAR_API_KEY;
  while (true) {
    KAVENEGAR_API_KEY = await question('Kavenegar API Key: ');
    if (KAVENEGAR_API_KEY.trim()) break;
    console.log(`${colors.red}API Key cannot be empty.${colors.reset}`);
  }
  
  let KAVENEGAR_SENDER;
  while (true) {
    KAVENEGAR_SENDER = await question('Kavenegar Sender Number: ');
    if (KAVENEGAR_SENDER.trim()) break;
    console.log(`${colors.red}Sender number cannot be empty.${colors.reset}`);
  }
  
  printSuccess('Kavenegar configuration set');
  
  // 6. Default OTP template
  const OTP_TEMPLATE = 'verify';
  console.log(`  OTP_TEMPLATE: ${OTP_TEMPLATE}`);
  
  // 7. Default OTP expiry (5 minutes)
  const OTP_EXPIRY_SECONDS = '300';
  console.log(`  OTP_EXPIRY_SECONDS: ${OTP_EXPIRY_SECONDS} (5 minutes)`);

  // 8. Ask for allowed origins
  printHeader('CORS Configuration');
  console.log('Enter allowed origins (comma-separated)');
  console.log(`${colors.yellow}Example: http://localhost:3000,http://localhost:5173${colors.reset}`);
  
  let ALLOWED_ORIGINS;
  while (true) {
    ALLOWED_ORIGINS = await question('Allowed Origins: ');
    if (ALLOWED_ORIGINS.trim()) break;
    console.log(`${colors.red}Allowed origins cannot be empty.${colors.reset}`);
  }
  
  printSuccess('CORS configuration set');

  // 9. Default file upload settings
  const MAX_FILE_SIZE = '5242880';
  const UPLOAD_PATH = 'uploads';
  const PORT = '4000';
  
  printHeader('File Upload Configuration (defaults)');
  console.log(`  MAX_FILE_SIZE: ${MAX_FILE_SIZE} (5MB)`);
  console.log(`  UPLOAD_PATH: ${UPLOAD_PATH}`);
  console.log(`  PORT: ${PORT}`);

  // Generate .env content
  const envContent = `# ===========================================
# Environment Configuration
# Generated by create-env CLI
# ===========================================

# ===========================================
# Database Configuration (PostgreSQL)
# ===========================================
DATABASE_URL="${DATABASE_URL}"

# ===========================================
# Server Configuration
# ===========================================
PORT=${PORT}
NODE_ENV=${NODE_ENV}

# Serve Mode:
# combined = Frontend + Backend (uses dist folder, serves full site)
# api = API only (for separate frontend development)
SERVE_MODE=${SERVE_MODE}

# ===========================================
# Session & Security Configuration
# ===========================================
SESSION_SECRET=${SESSION_SECRET}
SESSION_MAX_AGE=${SESSION_MAX_AGE}

# ===========================================
# SMS Service (Kavenegar) Configuration
# ===========================================
KAVENEGAR_API_KEY=${KAVENEGAR_API_KEY}
KAVENEGAR_SENDER=${KAVENEGAR_SENDER}
OTP_TEMPLATE=${OTP_TEMPLATE}
# Log mode: if true, OTP codes are logged instead of sending SMS
# Useful for saving SMS credits during development
SMS_LOG_ONLY=${SMS_LOG_ONLY}

# ===========================================
# OTP Configuration
# ===========================================
# OTP expiry time in seconds (e.g., 300 = 5 minutes)
OTP_EXPIRY_SECONDS=${OTP_EXPIRY_SECONDS}

# ===========================================
# CORS Configuration
# ===========================================
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}

# ===========================================
# File Upload Configuration
# ===========================================
MAX_FILE_SIZE=${MAX_FILE_SIZE}
UPLOAD_PATH=${UPLOAD_PATH}
`;

  // Write to .env file
  const envPath = path.join(__dirname, '../../.env');
  
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log(`\n${colors.yellow}Warning: .env file already exists!${colors.reset}`);
    const overwrite = await question('Do you want to overwrite it? (y/n): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log(`${colors.red}Operation cancelled. .env file was not modified.${colors.reset}`);
      rl.close();
      process.exit(0);
    }
  }
  
  fs.writeFileSync(envPath, envContent);
  
  console.log(`
${colors.bright}${colors.green}========================================${colors.reset}
${colors.bright}${colors.green}  .env file created successfully!${colors.reset}
${colors.bright}${colors.green}========================================${colors.reset}

${colors.cyan}Next steps:${colors.reset}
  1. Run ${colors.yellow}npm run prisma:generate${colors.reset} to generate Prisma client
  2. Run ${colors.yellow}npm run prisma:migrate${colors.reset} to run database migrations
  3. Run ${colors.yellow}npm run start${colors.reset} or ${colors.yellow}npm run dev${colors.reset} to start the server
`);
  
  rl.close();
}

main().catch(err => {
  console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
  rl.close();
  process.exit(1);
});

