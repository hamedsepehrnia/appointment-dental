#!/usr/bin/env node

require('dotenv').config();
const prisma = require('../config/database');
const { createSlug } = require('../utils/helpers');

// Random data for doctors
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

// Function to generate random working days for a clinic
const generateWorkingDaysForClinic = () => {
  const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const clinicWorkingDays = {};
  const selectedDays = [];
  
  // Select 3 to 5 random days
  const numDays = Math.floor(Math.random() * 3) + 3; // 3 to 5 days
  const shuffled = [...days].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < numDays; i++) {
    selectedDays.push(shuffled[i]);
  }
  
  // Generate random working hours
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

// Function to generate working days by clinic
// New structure: {"clinicId": {"saturday": "18:00-20:00", ...}, "clinicId2": {...}}
const generateWorkingDays = (clinicIds) => {
  const workingDays = {};
  
  clinicIds.forEach(clinicId => {
    workingDays[clinicId] = generateWorkingDaysForClinic();
  });
  
  return workingDays;
};

// Function to generate random medical license number
const generateMedicalLicenseNo = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

const seedDoctors = async (count = 20) => {
  try {
    console.log(`\n🌱 Starting creation of ${count} random doctors...\n`);

    // Check if clinics exist
    const clinics = await prisma.clinic.findMany({
      select: { id: true, name: true },
    });

    if (clinics.length === 0) {
      console.log('⚠️  No clinics found in database. Doctors will be created without clinics.');
    } else {
      console.log(`✓ Found ${clinics.length} clinics\n`);
    }

    const createdDoctors = [];
    const usedSlugs = new Set();
    const usedLicenseNos = new Set();

    for (let i = 0; i < count; i++) {
      // Select random first and last name
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      // Create unique slug
      let baseSlug = createSlug(`${firstName}-${lastName}`);
      let slug = baseSlug;
      let counter = 1;
      
      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      usedSlugs.add(slug);

      // Generate unique medical license number
      let medicalLicenseNo = generateMedicalLicenseNo();
      while (usedLicenseNos.has(medicalLicenseNo)) {
        medicalLicenseNo = generateMedicalLicenseNo();
      }
      usedLicenseNos.add(medicalLicenseNo);

      // Select random data
      const university = universities[Math.floor(Math.random() * universities.length)];
      const doctorSkills = skills[Math.floor(Math.random() * skills.length)];
      const biography = biographies[Math.floor(Math.random() * biographies.length)];

      // Select clinics first so working days can be created by clinic
      let selectedClinics = [];
      let workingDays = null;

      if (clinics.length > 0) {
        // Select 1 to 2 random clinics for each doctor
        const numClinics = Math.floor(Math.random() * 2) + 1; // 1 or 2 clinics
        selectedClinics = [...clinics]
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.min(numClinics, clinics.length));
        
        // Generate working days by clinic
        workingDays = generateWorkingDays(selectedClinics.map(c => c.id));
      }

      // Create doctor
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

      // Link to clinics
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
          `✓ Doctor ${i + 1}/${count}: ${firstName} ${lastName} (${selectedClinics.map(c => c.name).join(', ')})`
        );
      } else {
        console.log(`✓ Doctor ${i + 1}/${count}: ${firstName} ${lastName}`);
      }

      createdDoctors.push(doctor);
    }

    console.log(`\n✅ ${createdDoctors.length} doctors created successfully!\n`);

    // Display summary
    console.log('📊 Summary:');
    console.log(`   - Number of doctors created: ${createdDoctors.length}`);
    if (clinics.length > 0) {
      const doctorsWithClinics = await prisma.doctorClinic.count();
      console.log(`   - Number of doctor-clinic links: ${doctorsWithClinics}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating doctors:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

// Get count from command line arguments
const count = parseInt(process.argv[2]) || 20;

// Run seed
seedDoctors(count);

