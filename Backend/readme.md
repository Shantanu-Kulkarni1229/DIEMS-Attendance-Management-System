# DIEMS Attendance Backend

Production-style Node.js + Express backend for the College Attendance Management System.

## Overview

This backend provides role-based attendance management for:

- Super Admin
- Admin
- Teacher
- Student

Core capabilities:

- JWT authentication
- Role-based access control
- Teacher attendance marking and updates
- Student attendance viewing with subject-wise and overall percentage
- Daily attendance alert emails when attendance falls below 75%
- MongoDB persistence with Mongoose
- Scheduled cron job for attendance monitoring

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT
- bcryptjs
- Nodemailer
- node-cron

## Project Structure

```text
Backend/
├── config/
├── controllers/
├── jobs/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── .env
├── .env.example
├── package.json
└── server.js
```

## Setup

1. Install dependencies:

```bash
cd Backend
npm install
```

2. Create your environment file:

```bash
copy .env.example .env
```

3. Update `.env` with your own values:

```dotenv
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=no-reply@yourdomain.com
```

Important:

- Do not commit real credentials.
- Use a Gmail App Password or another SMTP provider for `SMTP_PASS`.
- Keep `JWT_SECRET` long and random.

## Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Server defaults to `http://localhost:5000`.

## Authentication Flow

1. Login through `POST /api/auth/login`
2. Save the returned JWT token
3. Send the token on protected requests:

```http
Authorization: Bearer <token>
```

## Roles and Permissions

### Super Admin

- Can create Admin users

### Admin

- Can create Teachers and Students
- Can update attendance records

### Teacher

- Can mark attendance
- Can update attendance that they created

### Student

- Can view own attendance summary

## API Reference

### Auth

#### POST `/api/auth/login`

Request:

```json
{
	"email": "teacher@example.com",
	"password": "password123"
}
```

Response:

```json
{
	"token": "jwt_token_here",
	"user": {
		"id": "...",
		"name": "Teacher Name",
		"email": "teacher@example.com",
		"role": "Teacher"
	}
}
```

### Admin

#### POST `/api/admin/create-teacher`

Protected: `SuperAdmin`, `Admin`

Request:

```json
{
	"name": "Teacher One",
	"email": "teacher1@college.edu",
	"password": "password123",
	"assignedClassrooms": [],
	"assignedClassrooms": []
}
```

#### POST `/api/admin/assign-teacher-subject`

Protected: `SuperAdmin`, `Admin`

Use this when the subject already exists and you want to assign a teacher to it.

Request:

```json
{
	"teacherId": "teacher_user_id_here",
	"subjectId": "subject_id_here"
}
```

#### POST `/api/admin/create-student`

Protected: `SuperAdmin`, `Admin`

Request:

```json
{
	"name": "Student One",
	"email": "student1@college.edu",
	"password": "password123",
	"classroom": "classroom_id_here"
}
```

### Teacher

#### POST `/api/teacher/mark-attendance`

Protected: `Teacher`

Request:

```json
{
	"date": "2026-05-06",
	"classroom": "classroom_id_here",
	"subject": "subject_id_here",
	"records": [
		{
			"student": "student_id_here",
			"status": "present"
		},
		{
			"student": "student_id_here",
			"status": "absent"
		}
	]
}
```

#### PUT `/api/teacher/update-attendance/:attendanceId`

Protected: `Teacher`, `Admin`, `SuperAdmin`

Request:

```json
{
	"records": [
		{
			"student": "student_id_here",
			"status": "present"
		}
	]
}
```

#### GET `/api/teacher/dashboard`

Protected: `Teacher`

This endpoint returns the teacher profile, recent attendance records, and assigned subjects.
The assigned subjects list is derived only from `subject.assignedTeacher`, which is the single source of truth.

Response:

```json
{
	"teacher": {
		"_id": "teacher_user_id_here",
		"name": "Teacher One",
		"email": "teacher1@college.edu",
		"branch": "CSE",
		"assignedClassrooms": []
	},
	"assignedSubjects": [
		{
			"_id": "subject_id_here",
			"name": "Database Systems",
			"code": "DBMS101",
			"year": 2,
			"assignedTeacher": {
				"_id": "teacher_user_id_here",
				"name": "Teacher One",
				"email": "teacher1@college.edu",
				"branch": "CSE"
			}
		}
	],
	"attendanceRecords": [],
	"sourceOfTruth": "subject.assignedTeacher"
}
```

### Student

#### GET `/api/student/attendance`

Protected: `Student`

Response:

```json
{
	"classroom": {
		"_id": "...",
		"name": "BSc CS - A"
	},
	"attendance": {
		"subjects": [
			{
				"subject": "Mathematics",
				"present": 8,
				"total": 10,
				"percentage": 80
			}
		],
		"overall": {
			"present": 16,
			"total": 20,
			"percentage": 80
		}
	}
}
```

## Frontend Integration Notes

- Call `POST /api/auth/login` first.
- Store the JWT in memory or secure storage on the client.
- Send the token in the `Authorization` header for every protected API call.
- Use the returned `role` field to route users to the correct dashboard.
- Build forms for teacher attendance entry using the `mark-attendance` payload shape.
- Student dashboard should call `GET /api/student/attendance` and render both subject-wise and overall values.

## Email Alerts

The cron job in `jobs/attendanceAlertJob.js` checks student attendance daily and sends email alerts when overall attendance falls below 75 percent.

## Validation

To verify that the backend files load without syntax issues:

```bash
cd Backend
node --check server.js
```

## Security Notes

- Replace the `.env` values before production.
- Use a strong random `JWT_SECRET`.
- Rotate exposed SMTP or database credentials immediately if they were committed or shared.

