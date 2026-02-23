#!/usr/bin/env node

/**
 * Seed script: Creates 2 clinics and 6 doctors (some shared between clinics)
 * for testing the clinic-selection feature.
 *
 * Usage:  node src/cli/seedClinicsAndDoctors.js
 */

require("dotenv").config();
const prisma = require("../config/database");
const { createSlug } = require("../utils/helpers");

// ---------- helpers ----------
const generateLicense = () =>
  String(Math.floor(10000 + Math.random() * 90000));

const generateWorkingDaysForClinic = () => ({
  saturday: "09:00-13:00",
  sunday: "09:00-13:00",
  monday: "14:00-18:00",
  tuesday: "14:00-18:00",
  wednesday: "09:00-13:00",
});

// ---------- data ----------
const CLINICS = [
  {
    name: "کلینیک دندانپزشکی نور",
    slug: "clinic-noor",
    address: "تهران، خیابان ولیعصر، پلاک ۱۲۰",
    phoneNumber: '["02112345678"]',
    description:
      "کلینیک تخصصی دندانپزشکی نور با بهره‌گیری از تجهیزات مدرن و پزشکان مجرب",
    workingHours: {
      saturday: "09:00-13:00&14:00-18:00",
      sunday: "09:00-13:00&14:00-18:00",
      monday: "09:00-13:00&14:00-18:00",
      tuesday: "09:00-13:00&14:00-18:00",
      wednesday: "09:00-13:00&14:00-18:00",
      thursday: "09:00-13:00",
      friday: null,
    },
  },
  {
    name: "کلینیک دندانپزشکی مهر",
    slug: "clinic-mehr",
    address: "تهران، خیابان شریعتی، پلاک ۸۵",
    phoneNumber: '["02187654321"]',
    description:
      "کلینیک دندانپزشکی مهر، ارائه‌دهنده خدمات ارتودنسی، ایمپلنت و زیبایی",
    workingHours: {
      saturday: "10:00-14:00&15:00-19:00",
      sunday: "10:00-14:00&15:00-19:00",
      monday: "10:00-14:00&15:00-19:00",
      tuesday: "10:00-14:00&15:00-19:00",
      wednesday: "10:00-14:00",
      thursday: null,
      friday: null,
    },
  },
];

// 6 doctors — indices 0-1 → clinic نور only, 2-3 → clinic مهر only, 4-5 → shared
const DOCTORS = [
  {
    firstName: "امیر",
    lastName: "کریمی",
    university: "دانشگاه علوم پزشکی تهران",
    skills: ["جراحی دندان", "ایمپلنت"],
    biography: "متخصص جراحی دندان و ایمپلنت با ۸ سال سابقه",
    shortDescription: "متخصص جراحی و ایمپلنت",
    isAppointmentEnabled: true,
    clinicIndex: [0], // فقط نور
  },
  {
    firstName: "سارا",
    lastName: "رحمانی",
    university: "دانشگاه علوم پزشکی شهید بهشتی",
    skills: ["ارتودنسی", "زیبایی دندان"],
    biography: "دندانپزشک متخصص ارتودنسی با تجربه بالا",
    shortDescription: "متخصص ارتودنسی",
    isAppointmentEnabled: true,
    clinicIndex: [0], // فقط نور
  },
  {
    firstName: "حسین",
    lastName: "محمدی",
    university: "دانشگاه علوم پزشکی اصفهان",
    skills: ["پروتز دندان", "لمینت"],
    biography: "متخصص پروتز و لمینت دندان",
    shortDescription: "متخصص پروتز و لمینت",
    isAppointmentEnabled: true,
    clinicIndex: [1], // فقط مهر
  },
  {
    firstName: "نرگس",
    lastName: "شریفی",
    university: "دانشگاه علوم پزشکی مشهد",
    skills: ["دندانپزشکی کودکان"],
    biography: "متخصص دندانپزشکی کودکان با تجربه در مراقبت ویژه",
    shortDescription: "متخصص دندانپزشکی کودکان",
    isAppointmentEnabled: true,
    clinicIndex: [1], // فقط مهر
  },
  {
    firstName: "مهدی",
    lastName: "احمدی",
    university: "دانشگاه علوم پزشکی ایران",
    skills: ["جراحی فک و صورت", "ایمپلنت"],
    biography:
      "متخصص جراحی فک و صورت با سابقه در هر دو کلینیک نور و مهر",
    shortDescription: "متخصص جراحی فک",
    isAppointmentEnabled: true,
    clinicIndex: [0, 1], // مشترک
  },
  {
    firstName: "فاطمه",
    lastName: "موسوی",
    university: "دانشگاه علوم پزشکی شیراز",
    skills: ["اندودنتیکس", "عصب‌کشی", "زیبایی"],
    biography:
      "دندانپزشک متخصص اندو و عصب‌کشی، فعال در کلینیک‌های نور و مهر",
    shortDescription: "متخصص اندو و عصب‌کشی",
    isAppointmentEnabled: true,
    clinicIndex: [0, 1], // مشترک
  },
];

// ---------- main ----------
async function main() {
  console.log("\n🌱  شروع seed کلینیک‌ها و پزشکان ...\n");

  // 1. ایجاد کلینیک‌ها (upsert برای اجرای مجدد بدون مشکل)
  const createdClinics = [];

  for (const c of CLINICS) {
    const clinic = await prisma.clinic.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        address: c.address,
        phoneNumber: c.phoneNumber,
        description: c.description,
        workingHours: c.workingHours,
      },
      create: {
        name: c.name,
        slug: c.slug,
        address: c.address,
        phoneNumber: c.phoneNumber,
        description: c.description,
        workingHours: c.workingHours,
      },
    });
    createdClinics.push(clinic);
    console.log(`  ✅  کلینیک "${clinic.name}" (${clinic.id})`);
  }

  console.log("");

  // 2. ایجاد پزشکان و لینک به کلینیک
  for (const d of DOCTORS) {
    // slug یکتا
    let baseSlug = createSlug(`${d.firstName}-${d.lastName}`);
    let slug = baseSlug;
    let i = 1;
    while (await prisma.doctor.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    // license یکتا
    let license = generateLicense();
    while (
      await prisma.doctor.findUnique({
        where: { medicalLicenseNo: license },
      })
    ) {
      license = generateLicense();
    }

    // working days per clinic
    const clinicIds = d.clinicIndex.map((idx) => createdClinics[idx].id);
    const workingDays = {};
    clinicIds.forEach((id) => {
      workingDays[id] = generateWorkingDaysForClinic();
    });

    const doctor = await prisma.doctor.create({
      data: {
        firstName: d.firstName,
        lastName: d.lastName,
        slug,
        university: d.university,
        skills: d.skills,
        biography: d.biography,
        shortDescription: d.shortDescription,
        medicalLicenseNo: license,
        isAppointmentEnabled: d.isAppointmentEnabled,
        workingDays,
      },
    });

    // لینک DoctorClinic
    for (const cId of clinicIds) {
      await prisma.doctorClinic.upsert({
        where: {
          doctorId_clinicId: { doctorId: doctor.id, clinicId: cId },
        },
        update: {},
        create: { doctorId: doctor.id, clinicId: cId },
      });
    }

    const clinicNames = d.clinicIndex
      .map((idx) => createdClinics[idx].name)
      .join(" + ");
    console.log(
      `  ✅  دکتر ${d.firstName} ${d.lastName}  →  ${clinicNames}`
    );
  }

  console.log("\n🎉  Seed با موفقیت انجام شد!\n");
  console.log("📊  خلاصه:");
  console.log(`   کلینیک‌ها: ${createdClinics.length}`);
  console.log(`   پزشکان:   ${DOCTORS.length}`);
  console.log(
    `   (${DOCTORS.filter((d) => d.clinicIndex.length === 1 && d.clinicIndex[0] === 0).length} فقط نور, ` +
      `${DOCTORS.filter((d) => d.clinicIndex.length === 1 && d.clinicIndex[0] === 1).length} فقط مهر, ` +
      `${DOCTORS.filter((d) => d.clinicIndex.length > 1).length} مشترک)\n`
  );
}

main()
  .catch((err) => {
    console.error("❌  خطا:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
