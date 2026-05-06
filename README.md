# DIEMS Attendance Management System

This repository contains the attendance system backend in `Backend/` and the frontend in `Frontend/`.

## What is implemented

- Role-based login for Super Admin, Admin, Teacher, and Student
- Attendance creation and update flow for teachers
- Student attendance dashboard with subject-wise and overall percentages
- MongoDB persistence, JWT authentication, password hashing, and email alerts

## Where to start

- Backend setup and API usage: [Backend/readme.md](Backend/readme.md)
- Backend environment template: [Backend/.env.example](Backend/.env.example)

## Backend API summary

- `POST /api/auth/login`
- `POST /api/admin/create-teacher`
- `POST /api/admin/create-student`
- `POST /api/teacher/mark-attendance`
- `PUT /api/teacher/update-attendance/:attendanceId`
- `GET /api/student/attendance`

## Frontend integration

Frontend developers should:

1. Log in with `POST /api/auth/login`
2. Store the JWT token returned by the backend
3. Send `Authorization: Bearer <token>` on protected routes
4. Route users based on the `role` returned in the login response
5. Use the request and response examples in [Backend/readme.md](Backend/readme.md)

## Security note

Do not commit real `.env` values. Rotate any exposed database or SMTP credentials immediately and replace them with secure local or secret-manager values.


