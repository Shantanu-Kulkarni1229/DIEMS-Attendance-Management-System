const express = require('express');
const router = express.Router();
const { markAttendance, updateAttendance, getTeacherAttendanceRecords, getTeacherDashboard } = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/mark-attendance', protect, authorizeRoles('Teacher'), markAttendance);
router.put('/update-attendance/:attendanceId', protect, authorizeRoles('Teacher','Admin','SuperAdmin'), updateAttendance);
router.get('/attendance-records', protect, authorizeRoles('Teacher','Admin','SuperAdmin'), getTeacherAttendanceRecords);
router.get('/dashboard', protect, authorizeRoles('Teacher'), getTeacherDashboard);

module.exports = router;
