const express = require('express');
const router = express.Router();
const { markAttendance, updateAttendance, patchAttendance, getTeacherAttendanceRecords, getTeacherDashboard, getStudentsForClassroom, getAttendanceContext } = require('../controllers/teacherController');
const { getTeacherLeaveRequests, reviewLeaveRequest } = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/mark-attendance', protect, authorizeRoles('Teacher'), markAttendance);
router.put('/update-attendance/:attendanceId', protect, authorizeRoles('Teacher','Admin','SuperAdmin'), updateAttendance);
router.patch('/update-attendance/:attendanceId', protect, authorizeRoles('Teacher','Admin','SuperAdmin'), patchAttendance);
router.get('/attendance-records', protect, authorizeRoles('Teacher','Admin','SuperAdmin'), getTeacherAttendanceRecords);
router.get('/classrooms/:classroomId/students', protect, authorizeRoles('Teacher','Admin','SuperAdmin'), getStudentsForClassroom);
router.get('/dashboard', protect, authorizeRoles('Teacher'), getTeacherDashboard);
router.get('/attendance-context', protect, authorizeRoles('Teacher'), getAttendanceContext);
router.get('/debug/me', protect, authorizeRoles('Teacher'), getTeacherDebug);
router.get('/leave-requests', protect, authorizeRoles('Teacher','Admin','SuperAdmin'), getTeacherLeaveRequests);
router.patch('/leave-requests/:leaveId', protect, authorizeRoles('Teacher','Admin','SuperAdmin'), reviewLeaveRequest);

module.exports = router;
