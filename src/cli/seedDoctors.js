#!/usr/bin/env node

require('dotenv').config();
const prisma = require('../config/database');
const { createSlug } = require('../utils/helpers');

// داده‌های رندوم برای پزشکان
const firstNames = [
  'علی', 'محمد', 'حسن', 'حسین', 'رضا', 'امیر', 'سعید', 'مهدی', 'احمد', 'حامد',
  'مریم', 'فاطمه', 'زهرا', 'سارا', 'نرگس', 'لیلا', 'سمیرا', 'نیلوفر', 'مهسا', 'پریسا'
];

const lastNames = [
  'احمدی', 'محمدی', 'حسینی', 'رضایی', 'کریمی', 'موسوی', 'نوری', 'صادقی', 'جعفری', 'اکبری',
  'علیزاده', 'رحمانی', 'کاظمی', 'شریفی', 'مهدوی', 'قاسمی', 'حیدری', 'باقری', 'طاهری', 'نظری'
];

const universities = [
  'دانشگاه علوم پزشکی تهران',
  'دانشگاه علوم پزشکی شهید بهشتی',
  'دانشگاه علوم پزشکی ایران',
  'دانشگاه علوم پزشکی اصفهان',
  'دانشگاه علوم پزشکی مشهد',
  'دانشگاه علوم پزشکی شیراز',
  'دانشگاه علوم پزشکی تبریز',
  'دانشگاه علوم پزشکی کرمان',
  'دانشگاه علوم پزشکی اهواز',
  'دانشگاه علوم پزشکی زاهدان'
];

const skills = [
  ['جراحی دندان', 'ایمپلنت', 'زیبایی'],
  ['ارتودنسی', 'زیبایی دندان'],
  ['پروتز دندان', 'ایمپلنت'],
  ['اندودنتیکس', 'عصب‌کشی'],
  ['پریودنتیکس', 'لثه'],
  ['جراحی فک و صورت'],
  ['دندانپزشکی کودکان'],
  ['زیبایی دندان', 'لمینت', 'بلیچینگ'],
  ['ایمپلنت', 'جراحی', 'پروتز'],
  ['ارتودنسی', 'جراحی فک']
];

const biographies = [
  'متخصص دندانپزشکی با بیش از ۱۰ سال سابقه کار در زمینه‌های مختلف دندانپزشکی',
  'دندانپزشک متخصص با تجربه در جراحی و ایمپلنت دندان',
  'متخصص ارتودنسی و زیبایی دندان با سابقه طولانی در درمان بیماران',
  'دندانپزشک با تخصص در پروتز و ایمپلنت دندان',
  'متخصص اندودنتیکس با تجربه در عصب‌کشی و درمان ریشه',
  'دندانپزشک متخصص در زمینه پریودنتیکس و درمان بیماری‌های لثه',
  'متخصص جراحی فک و صورت با سابقه درخشان در جراحی‌های پیچیده',
  'دندانپزشک کودکان با تجربه در درمان و مراقبت از دندان‌های کودکان',
  'متخصص زیبایی دندان با تخصص در لمینت و بلیچینگ',
  'دندانپزشک با تخصص در ایمپلنت و جراحی دندان'
];

// تابع برای ایجاد روزهای کاری رندوم برای یک کلینیک
const generateWorkingDaysForClinic = () => {
  const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const clinicWorkingDays = {};
  const selectedDays = [];
  
  // انتخاب 3 تا 5 روز رندوم
  const numDays = Math.floor(Math.random() * 3) + 3; // 3 تا 5 روز
  const shuffled = [...days].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < numDays; i++) {
    selectedDays.push(shuffled[i]);
  }
  
  // ایجاد ساعات کاری رندوم
  const timeSlots = [
    '09:00-13:00',
    '14:00-18:00',
    '10:00-14:00',
    '15:00-19:00',
    '08:00-12:00',
    '16:00-20:00'
  ];
  
  selectedDays.forEach(day => {
    clinicWorkingDays[day] = timeSlots[Math.floor(Math.random() * timeSlots.length)];
  });
  
  return clinicWorkingDays;
};

// تابع برای ایجاد ساعات کاری به تفکیک کلینیک
// ساختار جدید: {"clinicId": {"saturday": "18:00-20:00", ...}, "clinicId2": {...}}
const generateWorkingDays = (clinicIds) => {
  const workingDays = {};
  
  clinicIds.forEach(clinicId => {
    workingDays[clinicId] = generateWorkingDaysForClinic();
  });
  
  return workingDays;
};

// تابع برای ایجاد شماره نظام پزشکی رندوم
const generateMedicalLicenseNo = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

const seedDoctors = async (count = 20) => {
  try {
    console.log(`\n🌱 شروع ایجاد ${count} پزشک رندوم...\n`);

    // بررسی وجود کلینیک‌ها
    const clinics = await prisma.clinic.findMany({
      select: { id: true, name: true },
    });

    if (clinics.length === 0) {
      console.log('⚠️  هیچ کلینیکی در دیتابیس وجود ندارد. پزشکان بدون کلینیک ایجاد می‌شوند.');
    } else {
      console.log(`✓ ${clinics.length} کلینیک پیدا شد\n`);
    }

    const createdDoctors = [];
    const usedSlugs = new Set();
    const usedLicenseNos = new Set();

    for (let i = 0; i < count; i++) {
      // انتخاب نام و نام خانوادگی رندوم
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      // ایجاد slug یکتا
      let baseSlug = createSlug(`${firstName}-${lastName}`);
      let slug = baseSlug;
      let counter = 1;
      
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      usedSlugs.add(slug);

      // ایجاد شماره نظام پزشکی یکتا
      let medicalLicenseNo = generateMedicalLicenseNo();
      while (usedLicenseNos.has(medicalLicenseNo)) {
        medicalLicenseNo = generateMedicalLicenseNo();
      }
      usedLicenseNos.add(medicalLicenseNo);

      // انتخاب داده‌های رندوم
      const university = universities[Math.floor(Math.random() * universities.length)];
      const doctorSkills = skills[Math.floor(Math.random() * skills.length)];
      const biography = biographies[Math.floor(Math.random() * biographies.length)];

      // انتخاب کلینیک‌ها اول تا ساعات کاری به تفکیک کلینیک ایجاد شود
      let selectedClinics = [];
      let workingDays = null;

      if (clinics.length > 0) {
        // انتخاب 1 تا 2 کلینیک رندوم برای هر پزشک
        const numClinics = Math.floor(Math.random() * 2) + 1; // 1 یا 2 کلینیک
        selectedClinics = [...clinics]
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(numClinics, clinics.length));
        
        // ایجاد ساعات کاری به تفکیک کلینیک
        workingDays = generateWorkingDays(selectedClinics.map(c => c.id));
      }

      // ایجاد پزشک
      const doctor = await prisma.doctor.create({
        data: {
          firstName,
          lastName,
          slug,
          university,
          biography,
          skills: doctorSkills,
          medicalLicenseNo,
          workingDays,
        },
      });

      // لینک کردن به کلینیک‌ها
      if (selectedClinics.length > 0) {
        for (const clinic of selectedClinics) {
          await prisma.doctorClinic.create({
            data: {
              doctorId: doctor.id,
              clinicId: clinic.id,
            },
          });
        }

        console.log(
          `✓ پزشک ${i + 1}/${count}: ${firstName} ${lastName} (${selectedClinics.map(c => c.name).join(', ')})`
        );
      } else {
        console.log(`✓ پزشک ${i + 1}/${count}: ${firstName} ${lastName}`);
      }

      createdDoctors.push(doctor);
    }

    console.log(`\n✅ ${createdDoctors.length} پزشک با موفقیت ایجاد شد!\n`);

    // نمایش خلاصه
    console.log('📊 خلاصه:');
    console.log(`   - تعداد پزشکان ایجاد شده: ${createdDoctors.length}`);
    if (clinics.length > 0) {
      const doctorsWithClinics = await prisma.doctorClinic.count();
      console.log(`   - تعداد لینک‌های پزشک-کلینیک: ${doctorsWithClinics}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ خطا در ایجاد پزشکان:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// دریافت تعداد از آرگومان‌های خط فرمان
const count = parseInt(process.argv[2]) || 20;

// اجرای seed
seedDoctors(count);

