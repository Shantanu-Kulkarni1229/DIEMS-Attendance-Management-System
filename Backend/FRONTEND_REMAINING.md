# Frontend Remaining Requirements (Timetable + Attendance)

Purpose: This is a handoff document for frontend implementation so every visible action maps to backend behavior and attendance is tracked correctly per lecture slot.

## 1) Current Status (Already Implemented in Backend)

- Authentication and role access are implemented.
- Teacher can mark attendance.
- Student can view own attendance summary (subject-wise and overall).
- Attendance save validates:
  - teacher must be assigned to selected classroom
  - teacher must be assigned to selected subject
  - all students in payload must belong to selected classroom
  - no duplicate student row in one submission

Important current limitation:
- Attendance is currently stored by date + classroom + subject, not by timetable slot.
- So exact period tracking (10:15-11:15 vs 11:15-12:15) is not yet modeled.

## 2) Frontend Work Remaining Right Now (Without New Backend Models)

- Keep only functional menu items visible.
- Show teacher assigned classrooms and assigned subjects from teacher dashboard.
- Mark attendance form must always send:
  - date
  - classroom
  - subject
  - records: [{ student, status }]
- Show clear error UI for backend validation messages.
- In student dashboard, show:
  - overall attendance
  - subject-wise attendance
  - leave status

## 3) Required Product Behavior for Timetable-Based Attendance

Target flow:
- Teacher 1 sees slot 10:15-11:15 (ML), marks attendance, closes slot.
- Teacher 2 sees slot 11:15-12:15 (CN).
- If substitution happens (another teacher takes lecture), system should show actual teacher and still allow marking for that slot.
- Student should see attendance per lecture session and per subject totals.

This requires slot-based lecture session tracking.

## 4) Recommended Next Backend Upgrade (Needed for Full Timetable Logic)

### A) Timetable master (recurring plan)
Create TimetableEntry with fields:
- classroom
- dayOfWeek
- startTime
- endTime
- subject
- plannedTeacher
- validFrom
- validTo
- isActive

### B) Lecture session (daily executable instance)
Create LectureSession with fields:
- timetableEntry
- date
- classroom
- subject
- plannedTeacher
- actualTeacher
- status: planned | substituted | cancelled | completed
- substitutionReason (optional)
- substitutedBy (admin who approved, optional)

### C) Attendance linked to LectureSession
- Attendance should reference lectureSession.
- Unique key should be lectureSessionId (one attendance sheet per slot).

### D) Substitution API
- Admin can replace actualTeacher for one lecture session.
- Keep audit trail (who changed, reason, time).

## 5) Frontend Requirements After Timetable Upgrade

### Teacher dashboard
- Show Today slots in timeline format:
  - start-end time
  - classroom
  - subject
  - role badge: Planned / Substitute
  - action: Mark Attendance

### Mark attendance modal/page
- Open from selected lecture session card.
- Pre-fill classroom and subject from lectureSession.
- Do not allow editing lecture metadata manually.
- Submit by lectureSessionId.

### Student dashboard
- Subject-wise totals (existing)
- New: recent lecture-wise list with:
  - date
  - time slot
  - subject
  - status (present/absent)
  - teacher who delivered lecture

### Admin timetable screen
- Weekly timetable grid (classroom x time slots).
- Substitution action per session.
- View attendance completion status per slot.

## 6) API Contract Notes for Frontend Team

Current available:
- POST /api/teacher/mark-attendance
- PATCH /api/teacher/update-attendance/:attendanceId
- GET /api/teacher/dashboard
- GET /api/student/attendance

Newly implemented for timetable phase:
- POST /api/timetable/admin/entries
- GET /api/timetable/admin/entries
- POST /api/timetable/admin/sessions/generate
- GET /api/timetable/admin/sessions
- POST /api/timetable/admin/sessions/:sessionId/substitute
- GET /api/timetable/teacher/today
- POST /api/timetable/teacher/sessions/:sessionId/attendance
- GET /api/timetable/student/my-lectures

Planned next (not yet implemented):
- GET /api/timetable/classroom/:classroomId/week
- PATCH /api/timetable/admin/sessions/:sessionId/cancel
- GET /api/timetable/teacher/week
- GET /api/timetable/student/my-lectures/summary

## 7) UX Rules (Must Follow)

- Never show a Mark Attendance button when slot status is cancelled or completed.
- Show exact backend error text on form failures.
- Disable duplicate submissions while saving.
- Show clear indicator when lecture is substituted.
- For each slot, show if attendance is already marked.

## 8) Example Scenario Mapping

Scenario:
- 10:15-11:15 ML planned for Teacher A
- 11:15-12:15 CN planned for Teacher B
- Teacher C takes second slot as substitute

Expected system behavior:
- Slot 1: Teacher A marks attendance against Session S1.
- Slot 2: Admin sets substitute, actualTeacher = Teacher C for Session S2.
- Teacher C sees S2 in dashboard and marks attendance.
- Student attendance shows both sessions separately and contributes to subject totals.

---

Owner note:
- This document is intentionally frontend-focused.
- Backend team should keep this file updated whenever attendance or timetable APIs change.
