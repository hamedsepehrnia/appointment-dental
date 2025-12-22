/**
 * کنترلر برای callback های ایتا
 * منشی‌ها می‌توانند از طریق لینک‌های ایتا نوبت را تایید/رد/تماس/ادیت کنند
 */

const prisma = require("../config/database");
const { AppError } = require("../middlewares/errorHandler");
const smsService = require("../services/smsService");
const eitaaService = require("../services/eitaaService");
const { toJalali, getPersianDayName, formatTime } = require("../utils/helpers");

/**
 * گرفتن عنوان جنسیت
 */
const getGenderTitle = (gender) => {
  if (gender === 'MALE') return 'آقای';
  if (gender === 'FEMALE') return 'خانم';
  return '';
};

/**
 * ساخت پیام ایتا برای نوبت
 */
function buildEitaaMessage(appointment, status) {
  const actualPatientName = appointment.patientName || 
    (appointment.user ? `${appointment.user.firstName} ${appointment.user.lastName}` : "نامشخص");
  const doctorName = appointment.doctor
    ? `دکتر ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
    : "پزشک کلینیک";
  const persianDate = toJalali(appointment.appointmentDate);
  const dayName = getPersianDayName(appointment.appointmentDate);
  const time = formatTime(appointment.appointmentDate);
  const phoneNumber = appointment.patientPhone || appointment.user?.phoneNumber || "نامشخص";
  const adminLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/appointments-management/edit/${appointment.id}`;

  const statusText = status === "APPROVED_BY_USER" 
    ? "⏳ منتظر تایید منشی" 
    : status === "FINAL_APPROVED" 
    ? "✅ تایید شده" 
    : status === "CANCELED"
    ? "❌ لغو شده"
    : status;

  return `🔔 ${status === "APPROVED_BY_USER" ? "درخواست رزرو نوبت جدید" : "نوبت"}

👤 نام مراجع: ${actualPatientName}
📅 تاریخ: ${dayName} ${persianDate}
🕐 ساعت: ${time}
👨‍⚕️ پزشک: ${doctorName}
📞 تلفن مراجع: ${phoneNumber}

📊 وضعیت: ${statusText}

برای بررسی و اقدام:
${adminLink}`;
}

/**
 * آپدیت پیام ایتا در صورت وجود
 */
async function updateEitaaMessage(appointment, newStatus) {
  if (!appointment.eitaaMessageId || !appointment.clinic?.eitaaChatId) {
    return;
  }

  const siteSettings = await prisma.siteSettings.findFirst({
    select: {
      eitaaApiToken: true,
    },
  });

  if (!siteSettings?.eitaaApiToken) {
    return;
  }

  const eitaaMessage = buildEitaaMessage(appointment, newStatus);

  const result = await eitaaService.editMessage(
    siteSettings.eitaaApiToken,
    appointment.clinic.eitaaChatId,
    appointment.eitaaMessageId,
    eitaaMessage
  );

  if (!result.success) {
    console.error("خطا در آپدیت پیام ایتا:", result.error);
  }
}

/**
 * تایید نوبت از طریق ایتا
 * GET /api/appointments/eitaa/approve/:id
 */
const approveAppointment = async (req, res) => {
  const { id } = req.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          gender: true,
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          eitaaChatId: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  if (appointment.status === "FINAL_APPROVED") {
    return res.json({
      success: true,
      message: "این نوبت قبلاً تأیید شده است",
      appointment: {
        id: appointment.id,
        status: appointment.status,
      },
    });
  }

  if (appointment.status === "CANCELED") {
    throw new AppError("این نوبت لغو شده است و قابل تأیید نیست", 400);
  }

  // تأیید نوبت
  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: {
      status: "FINAL_APPROVED",
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          gender: true,
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // ارسال پیامک تأیید به بیمار
  const actualPatientName =
    updatedAppointment.patientName ||
    `${updatedAppointment.user?.firstName} ${updatedAppointment.user?.lastName}`;
  const genderTitle = getGenderTitle(updatedAppointment.user?.gender);
  const doctorName = updatedAppointment.doctor
    ? `دکتر ${updatedAppointment.doctor.firstName} ${updatedAppointment.doctor.lastName}`
    : "پزشک کلینیک";
  const persianDate = toJalali(updatedAppointment.appointmentDate);
  const dayName = getPersianDayName(updatedAppointment.appointmentDate);
  const time = formatTime(updatedAppointment.appointmentDate);

  const patientSmsMessage = `${genderTitle} ${actualPatientName} عزیز،
نوبت شما در کلینیک ${updatedAppointment.clinic.name} با ${doctorName} در ساعت ${time} روز ${dayName} ${persianDate} تأیید شد.
لطفاً در زمان مقرر در کلینیک حضور داشته باشید.`;

  if (updatedAppointment.user?.phoneNumber) {
    await smsService.sendSimpleSms(
      updatedAppointment.user.phoneNumber,
      patientSmsMessage,
      "بیمار",
      "✅ تأیید نوبت"
    );
  }

  // آپدیت پیام ایتا
  await updateEitaaMessage(updatedAppointment, "FINAL_APPROVED");

  res.json({
    success: true,
    message: "نوبت با موفقیت تأیید شد",
    data: { appointment: updatedAppointment },
  });
};

/**
 * رد نوبت از طریق ایتا
 * GET /api/appointments/eitaa/cancel/:id
 */
const cancelAppointment = async (req, res) => {
  const { id } = req.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          gender: true,
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
          eitaaChatId: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  if (appointment.status === "CANCELED") {
    return res.json({
      success: true,
      message: "این نوبت قبلاً لغو شده است",
      appointment: {
        id: appointment.id,
        status: appointment.status,
      },
    });
  }

  // لغو نوبت
  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: {
      status: "CANCELED",
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          gender: true,
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // ارسال پیامک لغو به بیمار
  const actualPatientName =
    updatedAppointment.patientName ||
    `${updatedAppointment.user?.firstName} ${updatedAppointment.user?.lastName}`;
  const genderTitle = getGenderTitle(updatedAppointment.user?.gender);
  const doctorName = updatedAppointment.doctor
    ? `دکتر ${updatedAppointment.doctor.firstName} ${updatedAppointment.doctor.lastName}`
    : "پزشک کلینیک";
  const persianDate = toJalali(updatedAppointment.appointmentDate);
  const dayName = getPersianDayName(updatedAppointment.appointmentDate);
  const time = formatTime(updatedAppointment.appointmentDate);

  const patientSmsMessage = `${genderTitle} ${actualPatientName} عزیز،
متأسفانه نوبت شما در کلینیک ${updatedAppointment.clinic.name} با ${doctorName} در ساعت ${time} روز ${dayName} ${persianDate} لغو شد.
لطفاً برای رزرو مجدد با کلینیک تماس بگیرید.`;

  if (updatedAppointment.user?.phoneNumber) {
    await smsService.sendSimpleSms(
      updatedAppointment.user.phoneNumber,
      patientSmsMessage,
      "بیمار",
      "❌ لغو نوبت"
    );
  }

  // آپدیت پیام ایتا
  await updateEitaaMessage(updatedAppointment, "CANCELED");

  res.json({
    success: true,
    message: "نوبت با موفقیت لغو شد",
    data: { appointment: updatedAppointment },
  });
};

/**
 * دریافت اطلاعات تماس مراجع از طریق ایتا
 * GET /api/appointments/eitaa/contact/:id
 */
const getContactInfo = async (req, res) => {
  const { id } = req.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          nationalCode: true,
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  const actualPatientName =
    appointment.patientName ||
    `${appointment.user?.firstName || ""} ${appointment.user?.lastName || ""}`.trim();

  const contactInfo = {
    patientName: actualPatientName,
    phoneNumber: appointment.patientPhone || appointment.user?.phoneNumber || "نامشخص",
    nationalCode: appointment.nationalCode || appointment.user?.nationalCode || "نامشخص",
    clinicName: appointment.clinic.name,
    clinicPhone: appointment.clinic.phoneNumber,
    doctorName: appointment.doctor
      ? `دکتر ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
      : "پزشک کلینیک",
  };

  // ارسال اطلاعات تماس به ایتا
  const siteSettings = await prisma.siteSettings.findFirst({
    select: {
      eitaaApiToken: true,
      eitaaChatId: true,
    },
  });

  if (siteSettings?.eitaaApiToken && siteSettings?.eitaaChatId) {
    const eitaaMessage = `📞 اطلاعات تماس مراجع

👤 نام: ${contactInfo.patientName}
📱 تلفن: ${contactInfo.phoneNumber}
🆔 کد ملی: ${contactInfo.nationalCode}
🏥 کلینیک: ${contactInfo.clinicName}
📞 تلفن کلینیک: ${contactInfo.clinicPhone}
👨‍⚕️ پزشک: ${contactInfo.doctorName}

برای تماس با مراجع:
tel:${contactInfo.phoneNumber}`;

    await eitaaService.sendMessage(
      siteSettings.eitaaApiToken,
      siteSettings.eitaaChatId,
      eitaaMessage
    );
  }

  res.json({
    success: true,
    message: "اطلاعات تماس ارسال شد",
    data: { contactInfo },
  });
};

module.exports = {
  approveAppointment,
  cancelAppointment,
  getContactInfo,
};

