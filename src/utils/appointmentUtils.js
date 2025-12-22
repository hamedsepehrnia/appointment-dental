const prisma = require("../config/database");

/**
 * دریافت تنظیمات نوبت‌دهی از SiteSettings
 */
const getAppointmentSettings = async () => {
  const settings = await prisma.siteSettings.findFirst({
    select: {
      appointmentMode: true,
      maxAppointmentsPerHour: true,
    },
  });

  return {
    mode: settings?.appointmentMode || "SIMPLE",
    maxPerHour: settings?.maxAppointmentsPerHour || 10,
  };
};

/**
 * بررسی اینکه آیا دکتر در یک بازه زمانی آزاد است یا نه
 * @param {string} doctorId - شناسه دکتر
 * @param {Date} startTime - زمان شروع نوبت جدید
 * @param {number} durationMinutes - مدت زمان نوبت به دقیقه
 * @param {string|null} excludeAppointmentId - شناسه نوبتی که باید از بررسی exclude شود (برای ویرایش)
 * @returns {Promise<{available: boolean, conflictingAppointment: object|null}>}
 */
const checkDoctorAvailability = async (
  doctorId,
  startTime,
  durationMinutes = 10,
  excludeAppointmentId = null
) => {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  // پیدا کردن نوبت‌های دکتر که با این بازه تداخل دارند
  // تداخل زمانی: (start1 < end2) AND (end1 > start2)
  const conflictingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorId,
      status: {
        in: ["APPROVED_BY_USER", "FINAL_APPROVED"],
      },
      ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      // بررسی تداخل زمانی
      AND: [
        {
          appointmentDate: {
            lt: endTime, // شروع نوبت موجود قبل از پایان نوبت جدید
          },
        },
      ],
    },
    select: {
      id: true,
      appointmentDate: true,
      durationMinutes: true,
      patientName: true,
      type: true,
    },
  });

  // بررسی دقیق‌تر تداخل (با در نظر گرفتن مدت زمان هر نوبت)
  for (const appointment of conflictingAppointments) {
    const existingStart = new Date(appointment.appointmentDate);
    const existingEnd = new Date(
      existingStart.getTime() + appointment.durationMinutes * 60 * 1000
    );

    // بررسی تداخل: (start1 < end2) AND (end1 > start2)
    if (startTime < existingEnd && endTime > existingStart) {
      return {
        available: false,
        conflictingAppointment: {
          id: appointment.id,
          startTime: existingStart,
          endTime: existingEnd,
          patientName: appointment.patientName,
          type: appointment.type,
        },
      };
    }
  }

  return {
    available: true,
    conflictingAppointment: null,
  };
};

/**
 * بررسی ظرفیت کلینیک در یک ساعت مشخص (برای نوبت‌های بدون دکتر)
 * @param {string} clinicId - شناسه کلینیک
 * @param {Date} appointmentTime - زمان نوبت
 * @param {number} maxPerHour - حداکثر تعداد نوبت بدون دکتر در ساعت
 * @param {string|null} excludeAppointmentId - شناسه نوبتی که باید از بررسی exclude شود
 * @returns {Promise<{available: boolean, currentCount: number, maxCount: number}>}
 */
const checkClinicCapacity = async (
  clinicId,
  appointmentTime,
  maxPerHour,
  excludeAppointmentId = null
) => {
  // شروع و پایان ساعت
  const hourStart = new Date(appointmentTime);
  hourStart.setMinutes(0, 0, 0);
  const hourEnd = new Date(hourStart);
  hourEnd.setHours(hourEnd.getHours() + 1);

  // شمارش نوبت‌های بدون دکتر در این ساعت
  const count = await prisma.appointment.count({
    where: {
      clinicId: clinicId,
      doctorId: null, // فقط نوبت‌های بدون دکتر
      status: {
        in: ["APPROVED_BY_USER", "FINAL_APPROVED"],
      },
      appointmentDate: {
        gte: hourStart,
        lt: hourEnd,
      },
      ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
    },
  });

  return {
    available: count < maxPerHour,
    currentCount: count,
    maxCount: maxPerHour,
  };
};

/**
 * بررسی کامل امکان رزرو نوبت (ترکیبی)
 * @param {object} params - پارامترهای نوبت
 * @returns {Promise<{canBook: boolean, error: string|null, details: object}>}
 */
const validateAppointmentBooking = async ({
  clinicId,
  doctorId,
  appointmentDate,
  durationMinutes = 10,
  excludeAppointmentId = null,
}) => {
  const settings = await getAppointmentSettings();

  // اگر حالت ساده است، بدون بررسی تداخل اجازه بده
  if (settings.mode === "SIMPLE") {
    return {
      canBook: true,
      error: null,
      details: { mode: "SIMPLE" },
    };
  }

  // حالت پیشرفته: بررسی تداخل
  const startTime = new Date(appointmentDate);

  // اگر دکتر انتخاب شده، بررسی تداخل دکتر
  if (doctorId) {
    const doctorCheck = await checkDoctorAvailability(
      doctorId,
      startTime,
      durationMinutes,
      excludeAppointmentId
    );

    if (!doctorCheck.available) {
      return {
        canBook: false,
        error: `این ساعت دکتر رزرو شده است. نوبت موجود: ${doctorCheck.conflictingAppointment.patientName || "بیمار"} (${doctorCheck.conflictingAppointment.type === "OPERATION" ? "عمل" : "مشاوره"})`,
        details: {
          mode: "ADVANCED",
          conflict: "DOCTOR_BUSY",
          conflictingAppointment: doctorCheck.conflictingAppointment,
        },
      };
    }
  }
  // اگر دکتر انتخاب نشده، بررسی ظرفیت کلینیک
  else {
    const capacityCheck = await checkClinicCapacity(
      clinicId,
      startTime,
      settings.maxPerHour,
      excludeAppointmentId
    );

    if (!capacityCheck.available) {
      return {
        canBook: false,
        error: `ظرفیت نوبت‌دهی این ساعت پر شده است (${capacityCheck.currentCount}/${capacityCheck.maxCount})`,
        details: {
          mode: "ADVANCED",
          conflict: "CLINIC_FULL",
          currentCount: capacityCheck.currentCount,
          maxCount: capacityCheck.maxCount,
        },
      };
    }
  }

  return {
    canBook: true,
    error: null,
    details: { mode: "ADVANCED" },
  };
};

/**
 * دریافت ساعات اشغال شده یک روز برای نمایش در فرانت‌اند
 * @param {string} clinicId - شناسه کلینیک
 * @param {string|null} doctorId - شناسه دکتر (اختیاری)
 * @param {Date} date - تاریخ مورد نظر
 * @returns {Promise<Array>}
 */
const getOccupiedSlots = async (clinicId, doctorId, date) => {
  const settings = await getAppointmentSettings();

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const where = {
    clinicId: clinicId,
    appointmentDate: {
      gte: dayStart,
      lt: dayEnd,
    },
  };

  // در حالت ساده: فقط نوبت‌های تأیید شده (FINAL_APPROVED) را برگردان
  // و فقط اگر دکتر انتخاب شده باشد
  if (settings.mode === "SIMPLE") {
    // در حالت ساده، فقط اگر دکتر انتخاب شده، نوبت‌های تأیید شده را برگردان
    if (!doctorId) {
      return []; // اگر دکتر انتخاب نشده، هیچ نوبتی اشغال نیست
    }
    where.status = "FINAL_APPROVED"; // فقط نوبت‌های تأیید شده
    where.doctorId = doctorId; // فقط نوبت‌های همان دکتر
  } else {
    // حالت پیشرفته: همه نوبت‌های تأیید شده
    where.status = {
      in: ["APPROVED_BY_USER", "FINAL_APPROVED"],
    };
    // اگر دکتر مشخص شده، فقط نوبت‌های آن دکتر
    if (doctorId) {
      where.doctorId = doctorId;
    }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    select: {
      id: true,
      appointmentDate: true,
      durationMinutes: true,
      type: true,
      doctorId: true,
    },
    orderBy: {
      appointmentDate: "asc",
    },
  });

  // تبدیل به فرمت مناسب برای فرانت‌اند
  return appointments.map((apt) => {
    const start = new Date(apt.appointmentDate);
    const end = new Date(start.getTime() + apt.durationMinutes * 60 * 1000);
    return {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      startHour: start.getHours(),
      startMinute: start.getMinutes(),
      durationMinutes: apt.durationMinutes,
      type: apt.type,
      doctorId: apt.doctorId,
    };
  });
};

/**
 * شمارش نوبت‌های بدون دکتر در هر ساعت یک روز
 * @param {string} clinicId - شناسه کلینیک
 * @param {Date} date - تاریخ مورد نظر
 * @returns {Promise<Object>} - شمارش به ازای هر ساعت
 */
const getHourlyNoDoctorCounts = async (clinicId, date) => {
  const settings = await getAppointmentSettings();

  if (settings.mode === "SIMPLE") {
    return {};
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId: clinicId,
      doctorId: null,
      status: {
        in: ["APPROVED_BY_USER", "FINAL_APPROVED"],
      },
      appointmentDate: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    select: {
      appointmentDate: true,
    },
  });

  // شمارش به ازای هر ساعت
  const hourlyCounts = {};
  for (const apt of appointments) {
    const hour = new Date(apt.appointmentDate).getHours();
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
  }

  return {
    counts: hourlyCounts,
    maxPerHour: settings.maxPerHour,
  };
};

module.exports = {
  getAppointmentSettings,
  checkDoctorAvailability,
  checkClinicCapacity,
  validateAppointmentBooking,
  getOccupiedSlots,
  getHourlyNoDoctorCounts,
};

