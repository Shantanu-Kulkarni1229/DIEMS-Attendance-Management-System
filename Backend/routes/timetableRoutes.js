const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  createTimetableEntry,
  listTimetableEntries,
  generateSessionsForDate,
  listLectureSessions,
  substituteLectureSession,
  getTeacherTodaySessions,
  markSessionAttendance,
  getStudentLectureAttendance
} = require('../controllers/timetableController');

// Admin / SuperAdmin timetable management
router.post('/admin/entries', protect, authorizeRoles('SuperAdmin', 'Admin'), createTimetableEntry);
router.get('/admin/entries', protect, authorizeRoles('SuperAdmin', 'Admin'), listTimetableEntries);
router.post('/admin/sessions/generate', protect, authorizeRoles('SuperAdmin', 'Admin'), generateSessionsForDate);
router.get('/admin/sessions', protect, authorizeRoles('SuperAdmin', 'Admin'), listLectureSessions);
router.post('/admin/sessions/:sessionId/substitute', protect, authorizeRoles('SuperAdmin', 'Admin'), substituteLectureSession);

// Teacher lecture sessions
router.get('/teacher/today', protect, authorizeRoles('Teacher'), getTeacherTodaySessions);
router.post('/teacher/sessions/:sessionId/attendance', protect, authorizeRoles('Teacher'), markSessionAttendance);

// Student lecture-wise attendance feed
router.get('/student/my-lectures', protect, authorizeRoles('Student'), getStudentLectureAttendance);

module.exports = router;
