const prisma = require("../config/database");
const { AppError } = require("../middlewares/errorHandler");
const { paginate, createPaginationMeta, toJalali, getPersianDayName, formatTime, fixNameForSms } = require("../utils/helpers");
const smsService = require("../services/smsService");
const eitaaService = require("../services/eitaaService");
const {
  validateAppointmentBooking,
  getOccupiedSlots,
  getHourlyNoDoctorCounts,
  getAppointmentSettings,
} = require("../utils/appointmentUtils");

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
 * گرفتن عنوان جنسیت
 */
const getGenderTitle = (gender) => {
  if (gender === 'MALE') return 'آقای';
  if (gender === 'FEMALE') return 'خانم';
  return '';
};

/**
 * ایجاد نوبت جدید توسط کاربر
 * POST /api/appointments
 */
const createAppointment = async (req, res) => {
  const { clinicId, doctorId, appointmentDate, patientName, nationalCode, notes } = req.body;
  const userId = req.session.userId;

  // بررسی اینکه تاریخ در آینده باشد
  const appointmentDateObj = new Date(appointmentDate);
  if (appointmentDateObj <= new Date()) {
    throw new AppError("تاریخ نوبت باید در آینده باشد", 400);
  }

  // بررسی وجود کلینیک
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, name: true, phoneNumber: true }
  });

  if (!clinic) {
    throw new AppError("کلینیک یافت نشد", 404);
  }

  // بررسی وجود پزشک (اگر انتخاب شده)
  let doctor = null;
  if (doctorId) {
    doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!doctor) {
      throw new AppError("پزشک یافت نشد", 404);
    }

    // بررسی اینکه پزشک در این کلینیک کار می‌کند
    const doctorClinic = await prisma.doctorClinic.findFirst({
      where: { doctorId, clinicId }
    });

    if (!doctorClinic) {
      throw new AppError("این پزشک در کلینیک انتخاب شده فعالیت نمی‌کند", 400);
    }
  }

  // بررسی تداخل نوبت (در حالت پیشرفته)
  const bookingValidation = await validateAppointmentBooking({
    clinicId,
    doctorId: doctorId || null,
    appointmentDate: appointmentDateObj,
    durationMinutes: 10, // نوبت مشاوره ۱۰ دقیقه
  });

  if (!bookingValidation.canBook) {
    throw new AppError(bookingValidation.error, 409); // 409 Conflict
  }

  // در حالت پیشرفته، نوبت مستقیماً تأیید می‌شود
  const appointmentSettings = await getAppointmentSettings();
  const finalStatus = appointmentSettings.mode === "ADVANCED" 
    ? "FINAL_APPROVED" 
    : "APPROVED_BY_USER";

  // گرفتن اطلاعات کاربر
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      firstName: true, 
      lastName: true, 
      phoneNumber: true, 
      gender: true,
      nationalCode: true
    }
  });

  if (!user) {
    throw new AppError("کاربر یافت نشد", 404);
  }

  // اگر نوبت برای خود کاربر است و کد ملی وارد شده ولی کاربر کد ملی ندارد، آن را در پروفایل ذخیره کن
  if (!patientName && nationalCode && !user.nationalCode) {
    await prisma.user.update({
      where: { id: userId },
      data: { nationalCode }
    });
  }

  // ایجاد نوبت
  const appointment = await prisma.appointment.create({
    data: {
      userId,
      clinicId,
      doctorId: doctorId || null,
      appointmentDate: appointmentDateObj,
      patientName: patientName || null,
      nationalCode: nationalCode || null,
      notes: notes || null,
      status: finalStatus, // در حالت پیشرفته مستقیماً تأیید می‌شود
      type: 'CONSULTATION', // نوبت مشاوره
      durationMinutes: 10,
      source: 'WEBSITE',
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          gender: true,
        }
      },
      clinic: {
        select: {
          id: true,
          name: true,
          address: true,
          phoneNumber: true,
        }
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  // نام مراجع (اگر برای شخص دیگری است یا خود کاربر)
  const actualPatientName = patientName || `${user.firstName} ${user.lastName}`;
  const genderTitle = getGenderTitle(user.gender);
  const doctorName = doctor ? `دکتر ${doctor.firstName} ${doctor.lastName}` : 'پزشک کلینیک';
  const persianDate = toJalali(appointmentDate);
  const dayName = getPersianDayName(appointmentDate);
  const time = formatTime(appointmentDate);

  // پیامک به مراجع
  const patientSmsMessageTemplate = finalStatus === "FINAL_APPROVED"
    ? `${genderTitle} {name} عزیز،
نوبت شما در کلینیک ${clinic.name} با ${doctorName} در ساعت ${time} روز ${dayName} ${persianDate} با موفقیت ثبت و تأیید شد.
لطفاً در زمان مقرر در کلینیک حضور داشته باشید.`
    : `${genderTitle} {name} عزیز،
نوبت شما در کلینیک ${clinic.name} با ${doctorName} در ساعت ${time} روز ${dayName} ${persianDate} ثبت شد و در دست بررسی می‌باشد.
لطفاً تا تأیید نهایی صبر کنید.`;
  
  const fixedName = fixNameForSms(actualPatientName, patientSmsMessageTemplate);
  const patientSmsMessage = patientSmsMessageTemplate.replace('{name}', fixedName);

  await smsService.sendSimpleSms(user.phoneNumber, patientSmsMessage, 'بیمار', '🗓️ ثبت نوبت');

  // در حالت پیشرفته، منشی نیازی به تأیید ندارد
  if (finalStatus === "APPROVED_BY_USER") {
    // دریافت تنظیمات نوتیفیکیشن
    const siteSettings = await prisma.siteSettings.findFirst({
      select: {
        secretaryNotificationMethod: true,
        eitaaApiToken: true,
      },
    });

    // دریافت اطلاعات کلینیک (شامل eitaaChatId)
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        eitaaChatId: true,
      },
    });

    const notificationMethod = siteSettings?.secretaryNotificationMethod || "SMS";
    const shouldSendSms = notificationMethod === "SMS" || notificationMethod === "BOTH";
    const shouldSendEitaa = (notificationMethod === "EITAA" || notificationMethod === "BOTH") 
      && siteSettings?.eitaaApiToken 
      && clinic?.eitaaChatId;

  // پیدا کردن منشی‌های کلینیک
  const secretaries = await prisma.user.findMany({
    where: {
      clinicId: clinicId,
      role: 'SECRETARY'
    },
    select: {
      id: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
    }
  });

  // لینک پنل ادمین (صفحه ویرایش نوبت)
  const adminLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/appointments-management/edit/${appointment.id}`;

    // پیامک به منشی (اگر SMS فعال باشد)
    if (shouldSendSms && secretaries.length > 0) {
  const secretarySmsMessage = `درخواست رزرو نوبت جدید

نام مراجع: ${actualPatientName}
تاریخ: ${dayName} ${persianDate} ساعت ${time}
پزشک: ${doctorName}
تلفن مراجع: ${user.phoneNumber}

برای بررسی به پنل مراجعه کنید:
${adminLink}`;

  // ارسال پیامک به همه منشی‌ها
  for (const secretary of secretaries) {
    await smsService.sendSimpleSms(secretary.phoneNumber, secretarySmsMessage, 'منشی', '🔔 درخواست نوبت جدید');
      }
    }

    // ارسال پیام به ایتا (اگر ایتا فعال باشد)
    if (shouldSendEitaa) {
      const eitaaMessage = buildEitaaMessage(
        {
          ...appointment,
          user: { phoneNumber: user.phoneNumber },
          doctor: appointment.doctor,
        },
        finalStatus
      );

      const eitaaResult = await eitaaService.sendMessage(
        siteSettings.eitaaApiToken,
        clinic.eitaaChatId,
        eitaaMessage,
        {
          title: `نوبت جدید - ${actualPatientName}`,
        }
      );

      if (eitaaResult.success && eitaaResult.messageId) {
        // ذخیره messageId برای آپدیت بعدی
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { eitaaMessageId: eitaaResult.messageId.toString() },
        });
      } else {
        console.error("خطا در ارسال پیام به ایتا:", eitaaResult.error);
      }
  }

  // ایجاد نوتیفیکیشن برای پنل ادمین
  await prisma.notification.create({
    data: {
      type: 'appointment_new',
      title: 'درخواست نوبت جدید',
      message: `درخواست نوبت جدید از ${actualPatientName} برای ${dayName} ${persianDate} ساعت ${time}`,
      link: `/admin/appointments/${appointment.id}`,
      appointmentId: appointment.id,
      clinicId: clinicId,
    }
  });
  }

  res.status(201).json({
    success: true,
    message: finalStatus === "FINAL_APPROVED"
      ? "نوبت با موفقیت ثبت و تأیید شد"
      : "نوبت با موفقیت ثبت شد و در انتظار تأیید منشی می‌باشد",
    data: { appointment }
  });
};

/**
 * گرفتن لیست نوبت‌ها (برای ادمین/منشی)
 * GET /api/appointments
 */
const getAppointments = async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    clinicId, 
    doctorId,
    fromDate,
    toDate,
    search
  } = req.query;
  
  const { skip, take } = paginate(parseInt(page), parseInt(limit));
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const where = {};

  // فیلتر بر اساس نقش کاربر
  if (userRole === 'SECRETARY') {
    // منشی فقط نوبت‌های کلینیک خودش را ببیند
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId) {
      where.clinicId = user.clinicId;
    }
  } else if (clinicId) {
    where.clinicId = clinicId;
  }

  // فیلتر وضعیت
  if (status) {
    where.status = status;
  }

  // فیلتر پزشک
  if (doctorId) {
    where.doctorId = doctorId;
  }

  // فیلتر تاریخ
  if (fromDate || toDate) {
    where.appointmentDate = {};
    if (fromDate) {
      where.appointmentDate.gte = new Date(fromDate);
    }
    if (toDate) {
      where.appointmentDate.lte = new Date(toDate);
    }
  }

  // جستجو
  if (search && search.trim()) {
    const searchTerm = search.trim();
    where.OR = [
      { patientName: { contains: searchTerm } },
      { patientPhone: { contains: searchTerm } },
      { user: { firstName: { contains: searchTerm } } },
      { user: { lastName: { contains: searchTerm } } },
      { user: { phoneNumber: { contains: searchTerm } } },
    ];
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            gender: true,
          }
        },
        clinic: {
          select: {
            id: true,
            name: true,
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }  // تازه‌ترین ها اول
    }),
    prisma.appointment.count({ where })
  ]);

  res.json({
    success: true,
    data: { appointments },
    meta: createPaginationMeta(total, parseInt(page), parseInt(limit))
  });
};

/**
 * گرفتن نوبت‌های کاربر جاری
 * GET /api/appointments/my
 */
const getMyAppointments = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const { skip, take } = paginate(parseInt(page), parseInt(limit));
  const userId = req.session.userId;

  const where = { userId };

  if (status) {
    where.status = status;
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take,
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phoneNumber: true,
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    }),
    prisma.appointment.count({ where })
  ]);

  res.json({
    success: true,
    data: { appointments },
    meta: createPaginationMeta(total, parseInt(page), parseInt(limit))
  });
};

/**
 * آمار نوبت‌های کاربر جاری
 * GET /api/appointments/my/stats
 */
const getMyAppointmentsStats = async (req, res) => {
  const userId = req.session.userId;

  const [
    approvedCount,
    pendingCount,
    canceledCount,
  ] = await Promise.all([
    prisma.appointment.count({ where: { userId, status: 'FINAL_APPROVED' } }),
    prisma.appointment.count({ where: { userId, status: 'APPROVED_BY_USER' } }),
    prisma.appointment.count({ where: { userId, status: 'CANCELED' } }),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        approved: approvedCount,
        pending: pendingCount,
        canceled: canceledCount,
      }
    }
  });
};

/**
 * گرفتن یک نوبت
 * GET /api/appointments/:id
 */
const getAppointment = async (req, res) => {
  const { id } = req.params;
  const userRole = req.session.userRole;
  const userId = req.session.userId;

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
          nationalCode: true,
          address: true,
        }
      },
      clinic: {
        select: {
          id: true,
          name: true,
          address: true,
          phoneNumber: true,
        }
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        }
      }
    }
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  // بررسی دسترسی
  if (userRole === 'PATIENT' && appointment.userId !== userId) {
    throw new AppError("شما دسترسی به این نوبت ندارید", 403);
  }

  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId !== appointment.clinicId) {
      throw new AppError("شما دسترسی به این نوبت ندارید", 403);
    }
  }

  res.json({
    success: true,
    data: { appointment }
  });
};

/**
 * تأیید نوبت توسط منشی
 * PATCH /api/appointments/:id/approve
 */
const approveAppointment = async (req, res) => {
  const { id } = req.params;
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          phoneNumber: true,
          gender: true,
        }
      },
      clinic: {
        select: {
          name: true,
          eitaaChatId: true,
        }
      },
      doctor: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  // بررسی دسترسی منشی
  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId !== appointment.clinicId) {
      throw new AppError("شما دسترسی به این نوبت ندارید", 403);
    }
  }

  // بررسی وضعیت فعلی
  if (appointment.status === 'FINAL_APPROVED') {
    throw new AppError("این نوبت قبلاً تأیید شده است", 400);
  }

  if (appointment.status === 'CANCELED') {
    throw new AppError("این نوبت لغو شده و قابل تأیید نیست", 400);
  }

  // به‌روزرسانی وضعیت
  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: { status: 'FINAL_APPROVED' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          phoneNumber: true,
        }
      },
      clinic: {
        select: {
          name: true,
          eitaaChatId: true,
        }
      },
      doctor: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  // اطلاعات برای پیامک
  const actualPatientName = appointment.patientName || `${appointment.user.firstName} ${appointment.user.lastName}`;
  const doctorName = appointment.doctor 
    ? `دکتر ${appointment.doctor.firstName} ${appointment.doctor.lastName}` 
    : 'پزشک کلینیک';
  const persianDate = toJalali(appointment.appointmentDate);
  const dayName = getPersianDayName(appointment.appointmentDate);
  const time = formatTime(appointment.appointmentDate);

  // پیامک تأیید به مراجع
  const confirmSmsMessageTemplate = `{name} عزیز،
نوبت شما در کلینیک ${appointment.clinic.name} با ${doctorName} در ساعت ${time} روز ${dayName} ${persianDate} تأیید شد.
لطفاً در تاریخ و زمان مقرر به کلینیک مراجعه نمایید.`;
  const fixedName = fixNameForSms(actualPatientName, confirmSmsMessageTemplate);
  const confirmSmsMessage = confirmSmsMessageTemplate.replace('{name}', fixedName);

  await smsService.sendSimpleSms(appointment.user.phoneNumber, confirmSmsMessage, 'بیمار', '✅ تأیید نوبت');

  // آپدیت پیام ایتا
  await updateEitaaMessage(updatedAppointment, "FINAL_APPROVED");

  res.json({
    success: true,
    message: "نوبت با موفقیت تأیید شد و پیامک به مراجع ارسال گردید",
    data: { appointment: updatedAppointment }
  });
};

/**
 * لغو نوبت
 * PATCH /api/appointments/:id/cancel
 */
const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          phoneNumber: true,
        }
      },
      clinic: {
        select: {
          name: true,
          eitaaChatId: true,
        }
      },
      doctor: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  // بررسی دسترسی
  if (userRole === 'PATIENT' && appointment.userId !== userId) {
    throw new AppError("شما دسترسی به این نوبت ندارید", 403);
  }

  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId !== appointment.clinicId) {
      throw new AppError("شما دسترسی به این نوبت ندارید", 403);
    }
  }

  // بررسی وضعیت فعلی
  if (appointment.status === 'CANCELED') {
    throw new AppError("این نوبت قبلاً لغو شده است", 400);
  }

  // به‌روزرسانی وضعیت
  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: { 
      status: 'CANCELED',
      notes: reason ? `${appointment.notes || ''}\nدلیل لغو: ${reason}`.trim() : appointment.notes
    }
  });

  // پیامک لغو به مراجع (فقط اگر منشی لغو کرده)
  if (userRole !== 'PATIENT') {
    const actualPatientName = appointment.patientName || `${appointment.user.firstName} ${appointment.user.lastName}`;
    const persianDate = toJalali(appointment.appointmentDate);
    const dayName = getPersianDayName(appointment.appointmentDate);
    const time = formatTime(appointment.appointmentDate);

    const cancelSmsMessageTemplate = `{name} عزیز،
متأسفانه نوبت شما در کلینیک ${appointment.clinic.name} برای ساعت ${time} روز ${dayName} ${persianDate} لغو شد.
${reason ? `دلیل: ${reason}` : ''}
برای رزرو مجدد با کلینیک تماس بگیرید.`;
    const fixedName = fixNameForSms(actualPatientName, cancelSmsMessageTemplate);
    const cancelSmsMessage = cancelSmsMessageTemplate.replace('{name}', fixedName);

    await smsService.sendSimpleSms(appointment.user.phoneNumber, cancelSmsMessage, 'بیمار', '❌ لغو نوبت');
  }

  // آپدیت پیام ایتا
  const appointmentWithRelations = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          phoneNumber: true,
        }
      },
      clinic: {
        select: {
          name: true,
          eitaaChatId: true,
        }
      },
      doctor: {
        select: {
          firstName: true,
          lastName: true,
        }
      }
    }
  });
  
  if (appointmentWithRelations) {
    await updateEitaaMessage(appointmentWithRelations, "CANCELED");
  }

  res.json({
    success: true,
    message: "نوبت با موفقیت لغو شد",
    data: { appointment: updatedAppointment }
  });
};

/**
 * به‌روزرسانی نوبت (ویرایش تاریخ/پزشک)
 * PATCH /api/appointments/:id
 */
const updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { appointmentDate, doctorId, patientName, nationalCode, notes } = req.body;
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  const appointment = await prisma.appointment.findUnique({
    where: { id }
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  // بررسی دسترسی
  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId !== appointment.clinicId) {
      throw new AppError("شما دسترسی به این نوبت ندارید", 403);
    }
  }

  // آماده‌سازی داده‌های به‌روزرسانی
  const updateData = {};
  
  if (appointmentDate) {
    updateData.appointmentDate = new Date(appointmentDate);
    // ریست یادآوری‌ها در صورت تغییر تاریخ
    updateData.reminder24hSent = false;
    updateData.reminder30mSent = false;
  }
  
  if (doctorId !== undefined) {
    updateData.doctorId = doctorId || null;
  }
  
  if (patientName !== undefined) {
    updateData.patientName = patientName || null;
  }
  
  if (nationalCode !== undefined) {
    updateData.nationalCode = nationalCode || null;
  }
  
  if (notes !== undefined) {
    updateData.notes = notes || null;
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
        }
      },
      clinic: {
        select: {
          id: true,
          name: true,
        }
      },
      doctor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      }
    }
  });

  res.json({
    success: true,
    message: "نوبت با موفقیت به‌روزرسانی شد",
    data: { appointment: updatedAppointment }
  });
};

/**
 * حذف نوبت (فقط ادمین)
 * DELETE /api/appointments/:id
 */
const deleteAppointment = async (req, res) => {
  const { id } = req.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id }
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  await prisma.appointment.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: "نوبت با موفقیت حذف شد"
  });
};

/**
 * آمار نوبت‌ها (داشبورد ادمین)
 * GET /api/appointments/stats
 */
const getAppointmentStats = async (req, res) => {
  const userRole = req.session.userRole;
  const userId = req.session.userId;

  let clinicFilter = {};

  // منشی فقط آمار کلینیک خودش را ببیند
  if (userRole === 'SECRETARY') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clinicId: true }
    });
    if (user?.clinicId) {
      clinicFilter = { clinicId: user.clinicId };
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalAppointments,
    approvedByUserCount,
    finalApprovedCount,
    canceledCount,
    todayCount,
  ] = await Promise.all([
    prisma.appointment.count({ where: clinicFilter }),
    prisma.appointment.count({ where: { ...clinicFilter, status: 'APPROVED_BY_USER' } }),
    prisma.appointment.count({ where: { ...clinicFilter, status: 'FINAL_APPROVED' } }),
    prisma.appointment.count({ where: { ...clinicFilter, status: 'CANCELED' } }),
    prisma.appointment.count({
      where: {
        ...clinicFilter,
        appointmentDate: {
          gte: today,
          lt: tomorrow
        },
        status: 'FINAL_APPROVED'
      }
    }),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        total: totalAppointments,
        awaitingApproval: approvedByUserCount,  // در انتظار تأیید منشی
        finalApproved: finalApprovedCount,       // تأیید شده
        canceled: canceledCount,                  // لغو شده
        todayAppointments: todayCount,           // نوبت‌های امروز
      }
    }
  });
};

/**
 * دریافت ساعات اشغال شده یک روز
 * GET /api/appointments/occupied-slots
 */
const getOccupiedSlotsHandler = async (req, res) => {
  const { clinicId, doctorId, date } = req.query;

  if (!clinicId || !date) {
    throw new AppError("clinicId و date الزامی است", 400);
  }

  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    throw new AppError("فرمت تاریخ نامعتبر است", 400);
  }

  const slots = await getOccupiedSlots(clinicId, doctorId || null, targetDate);
  const hourlyCounts = await getHourlyNoDoctorCounts(clinicId, targetDate);
  const settings = await getAppointmentSettings();

  res.json({
    success: true,
    data: {
      mode: settings.mode,
      occupiedSlots: slots,
      hourlyNoDoctorCounts: hourlyCounts,
    }
  });
};

/**
 * دریافت تنظیمات نوبت‌دهی (عمومی)
 * GET /api/appointments/settings
 */
const getAppointmentSettingsHandler = async (req, res) => {
  const settings = await getAppointmentSettings();

  res.json({
    success: true,
    data: {
      mode: settings.mode,
      maxAppointmentsPerHour: settings.maxPerHour,
    }
  });
};

module.exports = {
  createAppointment,
  getAppointments,
  getMyAppointments,
  getMyAppointmentsStats,
  getAppointment,
  approveAppointment,
  getOccupiedSlotsHandler,
  getAppointmentSettingsHandler,
  cancelAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStats,
};

