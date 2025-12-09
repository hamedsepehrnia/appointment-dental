<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/English-007ACC?style=for-the-badge&logo=readme&logoColor=white" alt="English"></a>
  <a href="README.fa.md"><img src="https://img.shields.io/badge/فارسی-00A550?style=for-the-badge&logo=readme&logoColor=white" alt="Persian"></a>
</p>

---

# 🦷 Dental Clinic Appointment Management System

A complete and professional API for dental clinic appointment management using Express.js, MySQL, and Prisma.

---

## 📋 Table of Contents

- [Features](#-features)
- [Technologies](#-technologies)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [CLI Tools](#-cli-tools)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Appointment System](#-appointment-system)
- [Notification System](#-notification-system)
- [Authentication](#-authentication)
- [User Roles](#-user-roles)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 📅 Appointment System

- ✅ Book appointments with or without selecting a doctor
- ✅ Book for yourself or others
- ✅ Secretary approval workflow
- ✅ Automatic SMS notifications
- ✅ 24-hour and 30-minute reminders
- ✅ Admin notification panel

### 👥 User Management

- ✅ Dual authentication: Password (Admin/Secretary) & OTP (All users)
- ✅ Three user roles: Admin, Secretary, Patient
- ✅ Profile management
- ✅ Session management with MySQL store

### 🏥 Clinic Management

- ✅ Clinic registration and management
- ✅ Assign secretary to each clinic
- ✅ Many-to-One relationship

### 👨‍⚕️ Doctor Management

- ✅ Complete doctor profiles
- ✅ Profile image upload
- ✅ Many-to-Many clinic relationship
- ✅ Filter and search by clinic

### 📝 Content Management

- ✅ Articles with SEO-friendly slugs
- ✅ Services with pricing and duration
- ✅ FAQ management with reordering
- ✅ Gallery with image management
- ✅ Site settings and social media
- ✅ Insurance organizations

### 💬 Review System

- ✅ Reviews for doctors, articles, services
- ✅ Automatic rating calculation
- ✅ Polymorphic comment system

---

## 🛠 Technologies

| Category | Technology |
|----------|------------|
| **Framework** | Express.js |
| **Database** | MySQL |
| **ORM** | Prisma |
| **Authentication** | Session-based (express-session + mysql2) |
| **SMS Service** | Kavenegar |
| **File Upload** | Multer |
| **Validation** | Joi |
| **Security** | Helmet, CORS, Rate Limiting, CSRF |
| **Password Hashing** | bcryptjs |
| **Logging** | Winston, Morgan |
| **Documentation** | Swagger/OpenAPI |
| **HTML Sanitization** | sanitize-html |
| **Compression** | express-compression |

---

## 📦 Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | v16+ |
| MySQL | v8+ |
| npm or yarn | Latest |
| Kavenegar API Key | For SMS |

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd appointment-dental
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Use the interactive CLI tool to create your `.env` file:

```bash
npm run create:env
```

This will guide you through setting up:
- Environment (Development/Production)
- Database credentials
- Session configuration
- SMS service (Kavenegar)
- CORS settings
- And more...

**Or manually create `.env`:**

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/appointment_dental"

# Server
PORT=4000
NODE_ENV=development
SERVE_MODE=combined

# Session
SESSION_SECRET=your-super-secret-key-here
SESSION_MAX_AGE=2592000000

# Kavenegar SMS
KAVENEGAR_API_KEY=your-api-key
KAVENEGAR_SENDER=your-sender-number
OTP_TEMPLATE=verify
SMS_LOG_ONLY=true

# OTP
OTP_EXPIRY_SECONDS=300

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads
```

### 4. Setup database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 5. Create upload directories

```bash
# Linux/Mac
mkdir -p uploads/{doctors,gallery,images,documents,insurance,site,users,videos}

# Windows PowerShell
New-Item -ItemType Directory -Force -Path uploads/doctors, uploads/gallery, uploads/images, uploads/documents, uploads/insurance, uploads/site, uploads/users, uploads/videos
```

### 6. Create admin user

```bash
npm run create:admin
```

### 7. Run server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server runs at `http://localhost:4000` (or your configured port).

---

## 🔧 CLI Tools

### Environment Setup

```bash
npm run create:env
```

Interactive CLI that creates your `.env` file with:

| Feature | Description |
|---------|-------------|
| Environment Selection | Choose Development or Production |
| Database Config | Set username, password, database name |
| Session Secret | Auto-generated 128-character secret |
| SMS Config | Kavenegar API key and sender |
| CORS Config | Allowed origins |
| Auto Defaults | PORT, MAX_FILE_SIZE, UPLOAD_PATH, etc. |

**Development Mode Settings:**
- `NODE_ENV=development`
- `SERVE_MODE=combined`
- `SMS_LOG_ONLY=true` (OTP codes logged, not sent)

**Production Mode Settings:**
- `NODE_ENV=production`
- `SERVE_MODE=combined`
- `SMS_LOG_ONLY=false` (Real SMS sent)

---

### User Management

```bash
# Create admin user
npm run create:admin

# Create secretary user
npm run create:secretary

# Seed sample doctors
npm run seed:doctors
```

---

### Database Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (GUI)
npm run prisma:studio
```

---

## 📁 Project Structure

```
appointment-dental/
├── prisma/
│   ├── migrations/          # Database migrations
│   └── schema.prisma        # Prisma schema
├── src/
│   ├── cli/
│   │   ├── createEnv.js     # Environment setup CLI
│   │   ├── createUser.js    # Admin/Secretary creation
│   │   └── seedDoctors.js   # Sample data seeder
│   ├── config/
│   │   ├── database.js      # Prisma configuration
│   │   └── session.js       # Session configuration
│   ├── controllers/
│   │   ├── appointmentController.js  # 📅 Appointments
│   │   ├── notificationController.js # 🔔 Notifications
│   │   ├── authController.js
│   │   ├── clinicController.js
│   │   ├── doctorController.js
│   │   ├── articleController.js
│   │   ├── serviceController.js
│   │   ├── commentController.js
│   │   ├── faqController.js
│   │   ├── galleryController.js
│   │   ├── settingsController.js
│   │   ├── insuranceController.js
│   │   └── uploadController.js
│   ├── middlewares/
│   │   ├── auth.js          # Authentication
│   │   ├── csrf.js          # CSRF protection
│   │   ├── errorHandler.js  # Error handling
│   │   ├── validation.js    # Joi validation
│   │   ├── upload.js        # File upload
│   │   └── asyncHandler.js  # Async wrapper
│   ├── routes/
│   │   ├── appointmentRoutes.js  # 📅
│   │   ├── notificationRoutes.js # 🔔
│   │   └── ... (other routes)
│   ├── services/
│   │   └── smsService.js    # Kavenegar SMS
│   └── utils/
│       ├── helpers.js       # Helper functions
│       ├── sanitizeHtml.js  # HTML sanitization
│       ├── cleanupJob.js    # OTP cleanup
│       └── reminderJob.js   # Appointment reminders
├── uploads/                 # Uploaded files
├── logs/                    # Log files
├── docs/                    # Documentation
├── dist/                    # Frontend build (combined mode)
├── .env                     # Environment variables
├── server.js                # Entry point
├── swagger-setup.js         # Swagger config
└── README.md
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:4000/api
```

### Swagger Documentation

```
http://localhost:4000/api-docs
```

---

## 📅 Appointment System

### Appointment Flow

```
Patient books appointment
         │
         ▼
   ┌─────────────────────────┐
   │ Status: APPROVED_BY_USER│  SMS sent to patient & secretary
   │ (Waiting for secretary) │  Notification created
   └─────────────────────────┘
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
   [Approve]      [Cancel]
       │             │
       ▼             ▼
┌─────────────┐ ┌─────────────┐
│FINAL_APPROVED│ │  CANCELED   │
│ SMS: Confirm │ │ SMS: Cancel │
└─────────────┘ └─────────────┘
       │
       ▼
┌─────────────────────┐
│  24h Reminder SMS   │
│  30min Reminder SMS │
└─────────────────────┘
```

### Appointment Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Pending (not used) |
| `APPROVED_BY_USER` | Waiting for secretary approval |
| `FINAL_APPROVED` | Confirmed |
| `CANCELED` | Canceled |

### Appointment Endpoints

#### Create Appointment

```http
POST /api/appointments
X-CSRF-Token: <token>
Content-Type: application/json

{
  "clinicId": "uuid",
  "doctorId": "uuid",          // Optional
  "appointmentDate": "2025-12-15T14:30:00.000Z",
  "patientName": "John Doe",   // Optional (for booking for others)
  "notes": "Notes"             // Optional
}
```

#### Get My Appointments

```http
GET /api/appointments/my?page=1&limit=10&status=FINAL_APPROVED
```

#### Get All Appointments (Admin/Secretary)

```http
GET /api/appointments?page=1&limit=10&status=APPROVED_BY_USER&search=john
```

| Parameter | Description |
|-----------|-------------|
| `page` | Page number |
| `limit` | Items per page |
| `status` | Filter by status |
| `clinicId` | Filter by clinic (Admin only) |
| `doctorId` | Filter by doctor |
| `fromDate` | From date (ISO) |
| `toDate` | To date (ISO) |
| `search` | Search in name, phone |

#### Get Single Appointment

```http
GET /api/appointments/:id
```

#### Approve Appointment

```http
PATCH /api/appointments/:id/approve
X-CSRF-Token: <token>
```

#### Cancel Appointment

```http
PATCH /api/appointments/:id/cancel
X-CSRF-Token: <token>
Content-Type: application/json

{
  "reason": "Cancellation reason"  // Optional
}
```

#### Update Appointment

```http
PATCH /api/appointments/:id
X-CSRF-Token: <token>
Content-Type: application/json

{
  "appointmentDate": "2025-12-16T15:00:00.000Z",
  "doctorId": "uuid",
  "patientName": "New Name",
  "notes": "New notes"
}
```

#### Delete Appointment (Admin only)

```http
DELETE /api/appointments/:id
X-CSRF-Token: <token>
```

#### Appointment Statistics

```http
GET /api/appointments/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 150,
      "pending": 0,
      "approvedByUser": 12,
      "finalApproved": 120,
      "canceled": 18,
      "todayAppointments": 5
    }
  }
}
```

### SMS Notifications

| Event | Recipient | Description |
|-------|-----------|-------------|
| Appointment Created | Patient | Confirmation + waiting for approval |
| Appointment Created | Secretary | New appointment notification |
| Appointment Approved | Patient | Confirmation with details |
| Appointment Canceled | Patient | Cancellation notice |
| 24h Before | Patient | Reminder |
| 30min Before | Patient | Urgent reminder |

---

## 🔔 Notification System

### Notification Endpoints

#### Get Notifications

```http
GET /api/notifications?page=1&limit=20&read=false
```

#### Get Unread Count

```http
GET /api/notifications/unread-count
```

**Response:**

```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

#### Mark as Read

```http
PATCH /api/notifications/:id/read
X-CSRF-Token: <token>
```

#### Mark All as Read

```http
PATCH /api/notifications/read-all
X-CSRF-Token: <token>
```

#### Delete Notification

```http
DELETE /api/notifications/:id
X-CSRF-Token: <token>
```

---

## 🔐 Authentication

### Two Authentication Methods

#### 1. Password Login (Admin/Secretary)

```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "09123456789",
  "password": "your-password"
}
```

#### 2. OTP Login (All Users)

**Step 1: Request OTP**

```http
POST /api/auth/request-otp
Content-Type: application/json

{
  "phoneNumber": "09123456789"
}
```

**Step 2: Verify OTP**

```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "09123456789",
  "code": "12345",
  "firstName": "John",      // Required for new users
  "lastName": "Doe"         // Required for new users
}
```

### Other Auth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/csrf-token` | GET | Get CSRF token |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/me` | PATCH | Update profile |
| `/api/auth/logout` | POST | Logout |

### Cookie Settings

| Property | Value |
|----------|-------|
| Name | `dental.sid` |
| HttpOnly | `true` |
| Secure | `true` (production) |
| SameSite | `lax` |
| Max Age | 30 days |

---

## 👥 User Roles

### Admin

| Permission | Access |
|------------|--------|
| Full access to all sections | ✅ |
| Create/delete clinics | ✅ |
| Create/delete doctors | ✅ |
| Manage all appointments | ✅ |
| Delete appointments | ✅ |
| Manage site settings | ✅ |
| Manage insurance organizations | ✅ |
| Delete any comment | ✅ |

**Create:**
```bash
npm run create:admin
```

### Secretary

| Permission | Access |
|------------|--------|
| View/edit own clinic | ✅ |
| Create/edit doctors | ✅ |
| Manage appointments (own clinic) | ✅ |
| Approve/cancel appointments | ✅ |
| Manage articles/services | ✅ |
| Manage FAQ/gallery | ✅ |

**Create:**
```bash
npm run create:secretary
```

### Patient

| Permission | Access |
|------------|--------|
| View public information | ✅ |
| Book appointments | ✅ |
| View/cancel own appointments | ✅ |
| Submit reviews | ✅ |
| Manage own profile | ✅ |

**Create:**
Auto-created on first OTP login.

---

## 🛡️ Security

### CSRF Protection

All POST, PATCH, DELETE requests require CSRF token:

```javascript
// 1. Get token
const { data } = await api.get('/auth/csrf-token');
const csrfToken = data.data.csrfToken;

// 2. Use in request
await api.post('/appointments', formData, {
  headers: { 'X-CSRF-Token': csrfToken }
});
```

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| All endpoints | 100 requests / 15 min |
| Request OTP | 5 requests / 15 min |
| Verify OTP | 10 requests / 15 min |
| Login | 10 requests / 15 min |

### Security Headers (Helmet)

- Content Security Policy (CSP)
- HSTS
- XSS Protection
- And more...

### Input Validation

- All inputs validated with Joi
- HTML content sanitized with sanitize-html

---

## 🐛 Troubleshooting

### Database Connection Error

| Check | Solution |
|-------|----------|
| MySQL running | Start MySQL service |
| DATABASE_URL | Verify in `.env` |
| User permissions | Check MySQL user access |

### SMS Error

| Check | Solution |
|-------|----------|
| API Key | Verify Kavenegar API key |
| Account balance | Check Kavenegar credit |
| Sender number | Verify sender number |

### File Upload Error

| Check | Solution |
|-------|----------|
| Directories exist | Create upload folders |
| Permissions | Check folder permissions |
| File size | Max 5MB (configurable) |

### CSRF Token Error

| Check | Solution |
|-------|----------|
| Session active | Ensure logged in |
| Token fetched | Get from `/api/auth/csrf-token` |
| Header sent | Include `X-CSRF-Token` |

### Rate Limit Error

| Solution |
|----------|
| Wait for limit to reset |
| Or whitelist IP in development |

---

## 📝 Important Notes

1. **Security**: Always change `SESSION_SECRET` in production
2. **SMS**: Configure Kavenegar API for OTP system
3. **File Upload**: Default max size is 5MB (configurable)
4. **CORS**: Configure `ALLOWED_ORIGINS` for your domains
5. **CSRF**: Always send CSRF token for POST/PATCH/DELETE
6. **OTP Expiry**: Codes expire after 5 minutes (configurable)

---

## 📄 License

MIT

---

## 👨‍💻 Developer

Built by the Dental Clinic Management System development team.

---

📅 Last Updated: December 2024
