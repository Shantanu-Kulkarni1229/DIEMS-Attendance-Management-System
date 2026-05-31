# DIEMS Attendance Frontend

React + Vite frontend for the DIEMS Attendance Management System.

## Current Working State

The frontend currently supports:

- Role-based login and routing for Student, Teacher, Admin, and Super Admin
- Teacher dashboard with assigned classrooms, assigned subjects, and attendance history
- Manual attendance marking with selectable session type and time slot
- Student attendance dashboard and leave request form with Cloudinary attachment upload
- Teacher leave review actions with attachment viewing

## Remaining Frontend Work

The backend now supports more of the production logic, but the frontend still needs these pieces finished:

- Fetch and render `practicalBatchSize` from the classroom data instead of assuming a hardcoded 20-student batch
- Add an Admin UI to edit classroom batch size per classroom, with validation for values like 10, 15, 20, or any valid number allowed by the backend
- Update the teacher practical batch UI so the batch cards are generated from the backend classroom setting
- Show the attachment link or preview in the teacher leave review screen so teachers can verify the uploaded proof
- Display leave-approved status clearly in student leave history after the teacher reviews the request
- Keep the attendance modal and leave flow aligned with the latest backend response fields so patch and approval flows do not break
- The frontend now uploads attachments through the backend before submitting the leave request

## Frontend Test Scenarios

Before merging the frontend work, test these cases at least two or three times with different data:

1. Practical batch sizes of 10, 15, and 20 students in one classroom.
2. Classrooms with fewer than one full batch and classrooms with multiple batches.
3. Practical attendance with one selected batch and with multiple selected batches.
4. Teacher attendance save, conflict, and patch flows for the same date/class/subject/slot.
5. Student leave submission with and without an attachment.
6. Approved leave syncing into the student attendance view and teacher review view.
7. Leave types such as Sick Leave, Medical Leave, Personal Leave, and Emergency Leave.
8. Half-day and full-day leave cases, including matching lecture slot coverage.

For each scenario, verify:

- The UI shows the correct batch grouping or leave state.
- The request payload contains the expected backend fields.
- The backend response is reflected back in the UI after save or approval.
- No hardcoded assumptions remain in the visible flow.

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

If the upload UI is added, the frontend should also include:

- Attachment upload button or drag-and-drop area
- Cloud upload progress or failure state
- Final attachment URL and metadata in the request body

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
