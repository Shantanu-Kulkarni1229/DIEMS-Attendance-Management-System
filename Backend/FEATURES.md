# Backend Features

This document lists the features implemented in the Backend of the DIEMS Attendance Management System.

## Overview

- Role-based attendance management for Super Admin, Admin, Teacher, and Student
- RESTful API built with Node.js + Express
- MongoDB persistence using Mongoose
- JWT-based authentication and role-based authorization
- Password hashing with `bcryptjs`

## Authentication & Authorization

- Login with email and password (`POST /api/auth/login`)
- JWT token issuance and validation
- `authMiddleware` protects endpoints
- `roleMiddleware` enforces role-specific permissions

## Roles & Capabilities

- Super Admin: create Admin users
- Admin: create Teachers and Students; update attendance records; assign teachers to subjects
- Teacher: mark attendance; update attendance they created; view teacher dashboard
- Student: view own attendance (subject-wise and overall percentages)

## Attendance Management

- Mark attendance with classroom, subject, date, and per-student records (`POST /api/teacher/mark-attendance`)
- Update attendance by `attendanceId` (`PUT /api/teacher/update-attendance/:attendanceId`)
- Retrieve teacher dashboard and recent attendance summaries (`GET /api/teacher/dashboard`)
- Student attendance summary endpoint (`GET /api/student/attendance`) with subject breakdown and overall percentage

## Notifications & Scheduled Jobs

- Daily attendance monitoring cron job (`jobs/attendanceAlertJob.js`)
- Email alerts sent via SMTP/Nodemailer when student overall attendance falls below threshold (default 75%)
- `emailService` wraps email sending logic

## Data Models

- `User` (base model) with discriminators for roles
- `Attendance` model stores date, classroom, subject, and records
- `Teacher`, `Student`, `Admin`, `SuperAdmin`, `Classroom`, `Subject` models implemented under `models/`

## Services & Utilities

- `attendanceService` contains attendance-related business logic
- `emailService` handles email composition and sending
- `utils/attendanceUtils.js` provides helper functions for attendance calculations
- Centralized error handling in `utils/errorHandler.js`

## Middleware

- `authMiddleware.js` validates JWT and attaches user to request
- `roleMiddleware.js` checks user role and access rights

## API Endpoints (Selected)

- `POST /api/auth/login` — authenticate and receive JWT
- `POST /api/admin/create-teacher` — create teacher (Admin/SuperAdmin)
- `POST /api/admin/create-student` — create student (Admin/SuperAdmin)
- `POST /api/admin/assign-teacher-subject` — assign teacher to subject
- `POST /api/teacher/mark-attendance` — mark attendance (Teacher)
- `PUT /api/teacher/update-attendance/:attendanceId` — update attendance (Teacher/Admin/SuperAdmin)
- `GET /api/teacher/dashboard` — teacher dashboard (Teacher)
- `GET /api/student/attendance` — student attendance view (Student)

## Project Structure

```text
Backend/
├── config/          # DB and environment config
├── controllers/     # Route handlers
├── jobs/            # Scheduled jobs (cron)
├── middleware/      # Auth & role middleware
├── models/          # Mongoose models
├── routes/          # Express routes
├── services/        # Business logic services
├── utils/           # Helpers and error handling
├── scripts/         # Utility scripts (createSuperAdmin)
├── server.js        # App entrypoint
└── package.json
```

## Tech Stack

- Node.js, Express
- MongoDB + Mongoose
- JWT, bcryptjs
- Nodemailer for emails
- node-cron for scheduled jobs

## Setup & Run

1. Install dependencies:

```bash
cd Backend
npm install
```

2. Copy and configure env:

```bash
copy .env.example .env
# fill in MONGO_URI, JWT_SECRET, SMTP credentials
```

3. Run in development:

```bash
npm run dev
```

## Notes & Recommendations

- Keep secrets out of source control; use environment variables.
- Use a secure SMTP provider or app-specific passwords for email sending.
- Keep `JWT_SECRET` long and rotate if compromised.

If you want this file expanded into a public-facing README or to include example payloads for every endpoint, tell me which endpoints to document and I'll add them.
