const prisma = require("../config/database");
const { AppError } = require("../middlewares/errorHandler");
const { checkDoctorAvailability, getAppointmentSettings } = require("../utils/appointmentUtils");

/**
 * سینک نوبت‌های عمل از نرم‌افزار آفلاین
 * POST /api/sync/appointments
 */
const syncAppointments = async (req, res) => {
  const { appointments } = req.body;
  const apiKeyInfo = req.syncApiKey; // اطلاعات API Key از middleware
  
  const results = {
    success: [],
    conflicts: [],
    errors: [],
  };

  const settings = await getAppointmentSettings();

  for (const apt of appointments) {
    try {
      const {
        externalId,
        clinicId: requestClinicId,
        doctorId,
        appointmentDate,
        durationMinutes,
        patientName,
        patientPhone,
        nationalCode,
        notes,
      } = apt;

      // اگر API Key به کلینیک خاصی محدود شده، فقط از آن کلینیک استفاده کن
      // در غیر این صورت از clinicId ارسال شده در درخواست استفاده کن
      const clinicId = apiKeyInfo.clinicId || requestClinicId;

      if (!clinicId) {
        results.errors.push({
          externalId,
          error: "شناسه کلینیک مشخص نشده است",
        });
        continue;
      }

      // بررسی وجود کلینیک
      const clinic = await prisma.clinic.findUnique({
        where: { id: clinicId },
      });

      if (!clinic) {
        results.errors.push({
          externalId,
          error: "کلینیک یافت نشد",
        });
        continue;
      }
      
      // اگر API Key به کلینیک دیگری محدود شده، اجازه نده
      if (apiKeyInfo.clinicId && apiKeyInfo.clinicId !== clinicId) {
        results.errors.push({
          externalId,
          error: `این API Key فقط برای کلینیک ${apiKeyInfo.clinic?.name || apiKeyInfo.clinicId} مجاز است`,
        });
        continue;
      }

      // بررسی وجود پزشک (اگر انتخاب شده)
      if (doctorId) {
        const doctor = await prisma.doctor.findUnique({
          where: { id: doctorId },
        });

        if (!doctor) {
          results.errors.push({
            externalId,
            error: "پزشک یافت نشد",
          });
          continue;
        }
      }

      // بررسی آیا این نوبت قبلاً سینک شده
      const existingAppointment = await prisma.appointment.findUnique({
        where: { externalId },
      });

      const appointmentDateObj = new Date(appointmentDate);

      // در حالت پیشرفته، بررسی تداخل
      if (settings.mode === "ADVANCED" && doctorId) {
        const availabilityCheck = await checkDoctorAvailability(
          doctorId,
          appointmentDateObj,
          durationMinutes,
          existingAppointment?.id || null
        );

        if (!availabilityCheck.available) {
          results.conflicts.push({
            externalId,
            conflict: "DOCTOR_BUSY",
            message: `دکتر در این ساعت نوبت مشاوره دارد`,
            conflictingAppointment: availabilityCheck.conflictingAppointment,
          });
          continue;
        }
      }

      if (existingAppointment) {
        // آپدیت نوبت موجود
        await prisma.appointment.update({
          where: { id: existingAppointment.id },
          data: {
            clinicId,
            doctorId: doctorId || null,
            appointmentDate: appointmentDateObj,
            durationMinutes,
            patientName: patientName || null,
            patientPhone: patientPhone || null,
            nationalCode: nationalCode || null,
            notes: notes || null,
            // ریست یادآوری‌ها اگر تاریخ تغییر کرده
            ...(existingAppointment.appointmentDate.getTime() !== appointmentDateObj.getTime() && {
              reminder24hSent: false,
              reminder30mSent: false,
            }),
          },
        });

        results.success.push({
          externalId,
          action: "updated",
          appointmentId: existingAppointment.id,
        });
      } else {
        // ایجاد نوبت جدید
        const newAppointment = await prisma.appointment.create({
          data: {
            externalId,
            clinicId,
            doctorId: doctorId || null,
            appointmentDate: appointmentDateObj,
            durationMinutes,
            patientName: patientName || null,
            patientPhone: patientPhone || null,
            nationalCode: nationalCode || null,
            notes: notes || null,
            type: "OPERATION",
            status: "FINAL_APPROVED", // نوبت‌های عمل مستقیماً تأیید شده هستند
            source: "OFFLINE_SOFTWARE",
          },
        });

        console.log(`✅ نوبت سینک شد: ${externalId} -> ${newAppointment.id}`, {
          clinicId,
          appointmentDate: appointmentDateObj,
          durationMinutes,
          patientName,
        });

        results.success.push({
          externalId,
          action: "created",
          appointmentId: newAppointment.id,
        });
      }
    } catch (error) {
      console.error(`Error syncing appointment ${apt.externalId}:`, error);
      results.errors.push({
        externalId: apt.externalId,
        error: error.message || "خطای ناشناخته",
      });
    }
  }

  const hasConflicts = results.conflicts.length > 0;
  const hasErrors = results.errors.length > 0;

  res.status(hasConflicts || hasErrors ? 207 : 200).json({
    success: !hasErrors,
    message: hasConflicts
      ? `${results.success.length} نوبت سینک شد، ${results.conflicts.length} تداخل وجود دارد`
      : hasErrors
      ? `${results.success.length} نوبت سینک شد، ${results.errors.length} خطا رخ داد`
      : `${results.success.length} نوبت با موفقیت سینک شد`,
    data: results,
  });
};

/**
 * حذف نوبت عمل از سرور
 * DELETE /api/sync/appointments
 */
const deleteAppointment = async (req, res) => {
  const { externalId } = req.body;

  const appointment = await prisma.appointment.findUnique({
    where: { externalId },
  });

  if (!appointment) {
    throw new AppError("نوبت یافت نشد", 404);
  }

  // فقط نوبت‌های عمل (از نرم‌افزار آفلاین) قابل حذف هستند
  if (appointment.source !== "OFFLINE_SOFTWARE") {
    throw new AppError("فقط نوبت‌های سینک شده از نرم‌افزار آفلاین قابل حذف هستند", 400);
  }

  await prisma.appointment.delete({
    where: { id: appointment.id },
  });

  res.json({
    success: true,
    message: "نوبت با موفقیت حذف شد",
  });
};

/**
 * بررسی وضعیت اتصال و تنظیمات
 * GET /api/sync/status
 */
const getStatus = async (req, res) => {
  const settings = await getAppointmentSettings();

  // شمارش نوبت‌های سینک شده
  const syncedCount = await prisma.appointment.count({
    where: { source: "OFFLINE_SOFTWARE" },
  });

  // آخرین سینک
  const lastSynced = await prisma.appointment.findFirst({
    where: { source: "OFFLINE_SOFTWARE" },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });

  res.json({
    success: true,
    data: {
      connected: true,
      mode: settings.mode,
      syncedAppointmentsCount: syncedCount,
      lastSyncTime: lastSynced?.updatedAt || null,
      serverTime: new Date().toISOString(),
    },
  });
};

/**
 * دریافت تداخل‌های موجود
 * GET /api/sync/conflicts
 */
const getConflicts = async (req, res) => {
  const settings = await getAppointmentSettings();

  if (settings.mode === "SIMPLE") {
    return res.json({
      success: true,
      data: {
        mode: "SIMPLE",
        conflicts: [],
        message: "در حالت ساده، تداخل بررسی نمی‌شود",
      },
    });
  }

  // پیدا کردن نوبت‌های عمل که با نوبت‌های مشاوره تداخل دارند
  const operationAppointments = await prisma.appointment.findMany({
    where: {
      type: "OPERATION",
      status: { in: ["APPROVED_BY_USER", "FINAL_APPROVED"] },
      appointmentDate: { gte: new Date() },
    },
    include: {
      doctor: { select: { id: true, firstName: true, lastName: true } },
      clinic: { select: { id: true, name: true } },
    },
  });

  const conflicts = [];

  for (const opApt of operationAppointments) {
    if (!opApt.doctorId) continue;

    const opStart = new Date(opApt.appointmentDate);
    const opEnd = new Date(opStart.getTime() + opApt.durationMinutes * 60 * 1000);

    // پیدا کردن نوبت‌های مشاوره همان دکتر که تداخل دارند
    const conflictingConsultations = await prisma.appointment.findMany({
      where: {
        id: { not: opApt.id },
        doctorId: opApt.doctorId,
        type: "CONSULTATION",
        status: { in: ["APPROVED_BY_USER", "FINAL_APPROVED"] },
        appointmentDate: {
          gte: new Date(opStart.getTime() - 60 * 60 * 1000), // یک ساعت قبل
          lte: opEnd,
        },
      },
      include: {
        user: { select: { firstName: true, lastName: true, phoneNumber: true } },
      },
    });

    for (const consApt of conflictingConsultations) {
      const consStart = new Date(consApt.appointmentDate);
      const consEnd = new Date(consStart.getTime() + consApt.durationMinutes * 60 * 1000);

      // بررسی تداخل واقعی
      if (opStart < consEnd && opEnd > consStart) {
        conflicts.push({
          operationAppointment: {
            id: opApt.id,
            externalId: opApt.externalId,
            startTime: opStart.toISOString(),
            endTime: opEnd.toISOString(),
            patientName: opApt.patientName,
            doctor: opApt.doctor,
            clinic: opApt.clinic,
          },
          consultationAppointment: {
            id: consApt.id,
            startTime: consStart.toISOString(),
            endTime: consEnd.toISOString(),
            patientName: consApt.patientName || `${consApt.user?.firstName} ${consApt.user?.lastName}`,
            patientPhone: consApt.user?.phoneNumber,
          },
        });
      }
    }
  }

  res.json({
    success: true,
    data: {
      mode: "ADVANCED",
      conflicts,
      conflictsCount: conflicts.length,
    },
  });
};

module.exports = {
  syncAppointments,
  deleteAppointment,
  getStatus,
  getConflicts,
};

