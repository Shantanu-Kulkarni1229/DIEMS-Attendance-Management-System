# DIEMS Attendance Frontend

React + Vite frontend for the DIEMS Attendance Management System.

## Current Working State

The frontend currently supports:

- Role-based login and routing for Student, Teacher, Admin, and Super Admin
- Teacher dashboard with assigned classrooms, assigned subjects, and attendance history
- Manual attendance marking with selectable session type and time slot
- Student attendance dashboard and leave request form
- Teacher leave review actions

## Teacher Attendance Flow

Teachers now mark attendance without choosing a timetable lecture number.

The modal requires:

- Date
- Class / Section
- Subject
- Session Type
- Time Slot

Available slots are fixed in the UI:

- Lecture: 10:15-11:15, 11:15-12:15, 1:15-2:15, 2:15-3:15, 3:30-4:30, 4:30-5:30
- Practical / Lab: 10:15-12:15, 1:15-3:15, 3:30-5:30

## Student Leave Flow

Students can submit leave requests with:

- Leave Type
- From Date
- To Date
- Reason

The backend stores the leave type separately from the duration enum, so the UI should continue sending:

- `duration: Full Day`
- `leaveType: Sick Leave | Medical Leave | Personal Leave | Emergency Leave`

## API Expectations

The frontend uses the backend at `http://localhost:5000` by default.

Protected requests should send:

```http
Authorization: Bearer <token>
```

## Development

Typical local commands:

```bash
cd Frontend
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Notes

- Keep the teacher dashboard aligned with the current classroom and subject assignments returned by the backend.
- Avoid reintroducing timetable-only selection in the attendance modal unless the backend model is extended for that workflow again.
- If you change slot definitions, update both the modal UI and the backend validation in tandem.
