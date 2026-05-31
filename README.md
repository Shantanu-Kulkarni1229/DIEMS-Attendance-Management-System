# DIEMS Attendance Management System

This repository contains the attendance system backend in `Backend/` and the frontend in `Frontend/`.

## Current State

The system is working around a manual attendance workflow:

- Teachers choose `Date`, `Class`, `Subject`, `Session Type`, and `Time Slot`
- Lecture slots are fixed to 1 hour
- Practical/Lab slots are fixed to 2 hours
- Attendance is stored against the selected time range, not a timetable lecture number
- Practical attendance stores the selected batch ids and a server-side batch snapshot for auditability
- Student leave requests store the leave category separately from the enum-safe duration field

### Practical Batch Reasoning

Practical batches are now treated as a real part of attendance data, not just a visual grouping in the UI.

- The frontend still groups students into 20-student practical batches so teachers can select batches quickly while taking attendance
- The backend now validates those batch ids before saving attendance, so the record cannot rely on a browser-only grouping
- The backend also stores a batch snapshot with the attendance record, which preserves the exact batch composition used that day
- This makes the system scalable because future reports, edits, and audits can use stored data instead of recreating the batch logic from the frontend
- This also protects attendance history if the classroom roster changes later, because the saved snapshot keeps the original practical grouping intact

## Assistant Context

- Current model used in this workspace: GPT-5.4 mini
- Current focus: keep backend and frontend aligned with the manual-slot attendance flow and role-based dashboard data

## What is implemented

- Role-based login for Super Admin, Admin, Teacher, and Student
- Manual slot-based attendance creation and update flow for teachers
- Student attendance dashboard with subject-wise and overall percentages
- MongoDB persistence, JWT authentication, password hashing, leave handling, and email alerts

## Where to start

- Backend setup and API usage: [Backend/readme.md](Backend/readme.md)
- Backend environment template: [Backend/.env.example](Backend/.env.example)

## Backend API summary

- `POST /api/auth/login`
- `POST /api/admin/create-teacher`
- `POST /api/admin/create-student`
- `POST /api/teacher/mark-attendance` with manual `sessionType`, `startTime`, and `endTime`
- `PUT /api/teacher/update-attendance/:attendanceId`
- `GET /api/student/attendance`

## Frontend integration

Frontend developers should:

1. Log in with `POST /api/auth/login`
2. Store the JWT token returned by the backend
3. Send `Authorization: Bearer <token>` on protected routes
4. Route users based on the `role` returned in the login response
5. Use the request and response examples in [Backend/readme.md](Backend/readme.md)
6. Keep teacher attendance screens aligned with the manual session slot options and current classroom/subject assignments

## Security note

Do not commit real `.env` values. Rotate any exposed database or SMTP credentials immediately and replace them with secure local or secret-manager values.


