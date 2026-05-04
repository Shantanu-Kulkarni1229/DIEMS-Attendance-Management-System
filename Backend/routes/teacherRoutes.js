const express = require('express');
const router = express.Router();
const { markAttendance, updateAttendance } = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/mark-attendance', protect, authorizeRoles('Teacher'), markAttendance);
router.put('/update-attendance/:attendanceId', protect, authorizeRoles('Teacher','Admin','SuperAdmin'), updateAttendance);

module.exports = router;
