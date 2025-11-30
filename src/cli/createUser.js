#!/usr/bin/env node

require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { formatPhoneNumber } = require('../utils/helpers');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createUser = async (role) => {
  try {
    console.log(`\n=== Create ${role === 'admin' ? 'Admin' : 'Secretary'} User ===\n`);

    const firstName = await question('First Name: ');
    if (!firstName) {
      console.error('Error: First name is required');
     process.exit(1);
    }

    const lastName = await question('Last Name: ');
    if (!lastName) {
      console.error('Error: Last name is required');
      process.exit(1);
    }

    // Ask for gender
    console.log('\nGender options:');
    console.log('  1. MALE');
    console.log('  2. FEMALE');
    console.log('  3. OTHER');
    console.log('  4. Skip (optional)');
    const genderChoice = await question('Select gender (1-4): ');
    
    let gender = null;
    if (genderChoice === '1') {
      gender = 'MALE';
    } else if (genderChoice === '2') {
      gender = 'FEMALE';
    } else if (genderChoice === '3') {
      gender = 'OTHER';
    } else if (genderChoice === '4' || !genderChoice) {
      gender = null;
    } else {
      console.error('Error: Invalid gender selection');
      process.exit(1);
    }

    const phoneNumber = await question('Phone Number (09xxxxxxxxx or Persian digits): ');
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      console.error('Error: Phone number is required and must be at least 10 characters');
      process.exit(1);
    }

    // Format phone number to standard format (handles both Persian and English digits)
    let formattedPhone;
    try {
      formattedPhone = formatPhoneNumber(phoneNumber);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }

    const password = await question('Password (min 6 characters): ');
    if (!password || password.length < 6) {
      console.error('Error: Password must be at least 6 characters');
      process.exit(1);
    }

    let clinicId = null;
    if (role === 'secretary') {
      // Show available clinics
      const clinics = await prisma.clinic.findMany({
        select: { id: true, name: true },
      });

      if (clinics.length === 0) {
        console.error('Error: No clinics found. Please create a clinic first.');
        process.exit(1);
      }

      console.log('\nAvailable Clinics:');
      clinics.forEach((clinic, index) => {
        console.log(`  ${index + 1}. ${clinic.name} (${clinic.id})`);
      });

      const clinicIndex = await question('\nSelect clinic number: ');
      const selectedClinic = clinics[parseInt(clinicIndex) - 1];

      if (!selectedClinic) {
        console.error('Error: Invalid clinic selection');
        process.exit(1);
      }

      clinicId = selectedClinic.id;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: formattedPhone },
    });

    if (existingUser) {
      console.error('Error: User with this phone number already exists');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        phoneNumber: formattedPhone,
        password: hashedPassword,
        role: role === 'admin' ? 'ADMIN' : 'SECRETARY',
        ...(clinicId && { clinicId }),
        ...(gender && { gender }),
      },
    });

    console.log('\n✓ User created successfully:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Phone: ${user.phoneNumber}`);
    console.log(`   Role: ${user.role}`);
    if (user.gender) {
      console.log(`   Gender: ${user.gender}`);
    }
    if (clinicId) {
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      console.log(`   Clinic: ${clinic.name}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
};

// Get role from command line arguments
const role = process.argv[2];

if (!role || !['admin', 'secretary'].includes(role)) {
  console.error('Usage: node createUser.js [admin|secretary]');
  console.error('Example: npm run create:admin');
  process.exit(1);
}

createUser(role);

