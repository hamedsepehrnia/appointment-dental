#!/usr/bin/env node

require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

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
    console.log(`\n=== ایجاد کاربر ${role === 'admin' ? 'مدیر' : 'منشی'} ===\n`);

    const firstName = await question('نام: ');
    if (!firstName) {
      console.error('❌ نام الزامی است');
      process.exit(1);
    }

    const lastName = await question('نام خانوادگی: ');
    if (!lastName) {
      console.error('❌ نام خانوادگی الزامی است');
      process.exit(1);
    }

    const phoneNumber = await question('شماره تلفن (09xxxxxxxxx): ');
    if (!phoneNumber || !phoneNumber.match(/^09\d{9}$/)) {
      console.error('❌ شماره تلفن نامعتبر است');
      process.exit(1);
    }

    const password = await question('رمز عبور: ');
    if (!password || password.length < 6) {
      console.error('❌ رمز عبور باید حداقل ۶ کاراکتر باشد');
      process.exit(1);
    }

    let clinicId = null;
    if (role === 'secretary') {
      // Show available clinics
      const clinics = await prisma.clinic.findMany({
        select: { id: true, name: true },
      });

      if (clinics.length === 0) {
        console.error('❌ هیچ کلینیکی وجود ندارد. ابتدا یک کلینیک ایجاد کنید.');
        process.exit(1);
      }

      console.log('\n📋 کلینیک‌های موجود:');
      clinics.forEach((clinic, index) => {
        console.log(`  ${index + 1}. ${clinic.name} (${clinic.id})`);
      });

      const clinicIndex = await question('\nشماره کلینیک را وارد کنید: ');
      const selectedClinic = clinics[parseInt(clinicIndex) - 1];

      if (!selectedClinic) {
        console.error('❌ کلینیک انتخاب شده نامعتبر است');
        process.exit(1);
      }

      clinicId = selectedClinic.id;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUser) {
      console.error('❌ کاربری با این شماره تلفن قبلاً ثبت شده است');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        phoneNumber,
        password: hashedPassword,
        role: role === 'admin' ? 'ADMIN' : 'SECRETARY',
        ...(clinicId && { clinicId }),
      },
    });

    console.log('\n✅ کاربر با موفقیت ایجاد شد:');
    console.log(`   نام: ${user.firstName} ${user.lastName}`);
    console.log(`   شماره تلفن: ${user.phoneNumber}`);
    console.log(`   نقش: ${user.role}`);
    if (clinicId) {
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      console.log(`   کلینیک: ${clinic.name}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ خطا:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
};

// Get role from command line arguments
const role = process.argv[2];

if (!role || !['admin', 'secretary'].includes(role)) {
  console.error('❌ استفاده: node createUser.js [admin|secretary]');
  process.exit(1);
}

createUser(role);

