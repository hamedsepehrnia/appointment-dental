const prisma = require("../config/database");
const smsService = require("../services/smsService");

/**
 * تبدیل تاریخ میلادی به شمسی
 */
const toJalali = (date) => {
  const d = new Date(date);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    calendar: 'persian',
    numberingSystem: 'latn'
  };
  return d.toLocaleDateString('fa-IR', options);
};

/**
 * گرفتن نام روز هفته به فارسی
 */
const getPersianDayName = (date) => {
  const days = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  return days[new Date(date).getDay()];
};

/**
 * فرمت ساعت
 */
const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * ارسال یادآوری ۲۴ ساعت قبل از نوبت
 */
const send24HourReminders = async () => {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);

  // نوبت‌هایی که ۲۴ ساعت تا شروعشان باقی مانده (بازه ۲۳-۲۴ ساعت)
  const appointments = await prisma.appointment.findMany({
    where: {
      status: 'FINAL_APPROVED',
      reminder24hSent: false,
      appointmentDate: {
        gte: in23Hours,
        lte: in24Hours,
      }
    },
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
          address: true,
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

  console.log(`📅 Found ${appointments.length} appointments for 24h reminder`);

  for (const appointment of appointments) {
    try {
      const patientName = appointment.patientName || `${appointment.user.firstName} ${appointment.user.lastName}`;
      const doctorName = appointment.doctor 
        ? `دکتر ${appointment.doctor.firstName} ${appointment.doctor.lastName}` 
        : 'پزشک کلینیک';
      const persianDate = toJalali(appointment.appointmentDate);
      const dayName = getPersianDayName(appointment.appointmentDate);
      const time = formatTime(appointment.appointmentDate);

      const message = `${patientName} عزیز،
یادآوری: نوبت شما در کلینیک ${appointment.clinic.name} با ${doctorName} فردا ساعت ${time} (${dayName} ${persianDate}) می‌باشد.
آدرس: ${appointment.clinic.address}
لطفاً به موقع حضور داشته باشید.`;

      await smsService.sendSimpleSms(appointment.user.phoneNumber, message, 'بیمار', '⏰ یادآوری ۲۴ ساعته');

      // علامت‌گذاری به عنوان ارسال شده
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminder24hSent: true }
      });

      console.log(`✅ 24h reminder sent for appointment ${appointment.id}`);
    } catch (error) {
      console.error(`❌ Error sending 24h reminder for appointment ${appointment.id}:`, error);
    }
  }

  return appointments.length;
};

/**
 * ارسال یادآوری ۳۰ دقیقه قبل از نوبت
 */
const send30MinuteReminders = async () => {
  const now = new Date();
  const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
  const in25Minutes = new Date(now.getTime() + 25 * 60 * 1000);

  // نوبت‌هایی که ۳۰ دقیقه تا شروعشان باقی مانده (بازه ۲۵-۳۰ دقیقه)
  const appointments = await prisma.appointment.findMany({
    where: {
      status: 'FINAL_APPROVED',
      reminder30mSent: false,
      appointmentDate: {
        gte: in25Minutes,
        lte: in30Minutes,
      }
    },
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
          address: true,
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

  console.log(`⏰ Found ${appointments.length} appointments for 30m reminder`);

  for (const appointment of appointments) {
    try {
      const patientName = appointment.patientName || `${appointment.user.firstName} ${appointment.user.lastName}`;
      const doctorName = appointment.doctor 
        ? `دکتر ${appointment.doctor.firstName} ${appointment.doctor.lastName}` 
        : 'پزشک کلینیک';
      const time = formatTime(appointment.appointmentDate);

      const message = `${patientName} عزیز،
یادآوری فوری: نوبت شما در کلینیک ${appointment.clinic.name} با ${doctorName} تا ۳۰ دقیقه دیگر (ساعت ${time}) است.
آدرس: ${appointment.clinic.address}`;

      await smsService.sendSimpleSms(appointment.user.phoneNumber, message, 'بیمار', '🚨 یادآوری فوری ۳۰ دقیقه');

      // علامت‌گذاری به عنوان ارسال شده
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminder30mSent: true }
      });

      console.log(`✅ 30m reminder sent for appointment ${appointment.id}`);
    } catch (error) {
      console.error(`❌ Error sending 30m reminder for appointment ${appointment.id}:`, error);
    }
  }

  return appointments.length;
};

/**
 * پاکسازی نوبت‌های قدیمی (گذشته و لغو شده بیش از ۶ ماه)
 */
const cleanupOldAppointments = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const result = await prisma.appointment.deleteMany({
    where: {
      OR: [
        // نوبت‌های لغو شده قدیمی
        {
          status: 'CANCELED',
          updatedAt: { lt: sixMonthsAgo }
        },
        // نوبت‌های گذشته که تأیید نشدند
        {
          status: 'APPROVED_BY_USER',  // نوبت‌های در انتظار تأیید منشی
          appointmentDate: { lt: sixMonthsAgo }
        }
      ]
    }
  });

  console.log(`🧹 Cleaned up ${result.count} old appointments`);
  return result.count;
};

/**
 * تنظیم جاب یادآوری
 * هر ۵ دقیقه اجرا می‌شود
 */
const setupReminderJob = () => {
  console.log('🔔 Setting up appointment reminder job...');

  // اجرا هر ۵ دقیقه
  const interval = 5 * 60 * 1000; // 5 minutes

  setInterval(async () => {
    try {
      console.log('🔄 Running reminder job...');
      
      const sent24h = await send24HourReminders();
      const sent30m = await send30MinuteReminders();
      
      if (sent24h > 0 || sent30m > 0) {
        console.log(`📤 Reminders sent: ${sent24h} (24h), ${sent30m} (30m)`);
      }
    } catch (error) {
      console.error('❌ Error in reminder job:', error);
    }
  }, interval);

  // اجرای پاکسازی روزانه (هر ۲۴ ساعت)
  setInterval(async () => {
    try {
      await cleanupOldAppointments();
    } catch (error) {
      console.error('❌ Error in cleanup job:', error);
    }
  }, 24 * 60 * 60 * 1000);

  // اجرای فوری یکبار برای نوبت‌های معوق
  setTimeout(async () => {
    try {
      await send24HourReminders();
      await send30MinuteReminders();
    } catch (error) {
      console.error('❌ Error in initial reminder check:', error);
    }
  }, 10000); // 10 ثانیه بعد از استارت

  console.log('✅ Reminder job setup complete (runs every 5 minutes)');
};

module.exports = {
  setupReminderJob,
  send24HourReminders,
  send30MinuteReminders,
  cleanupOldAppointments,
};

