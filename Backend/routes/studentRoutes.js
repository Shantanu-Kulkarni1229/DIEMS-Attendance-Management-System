const express = require('express');
const router = express.Router();
const { getAttendance } = require('../controllers/studentController');
const { createLeaveRequest, getMyLeaveRequests } = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/attendance', protect, authorizeRoles('Student'), getAttendance);
router.post('/leaves', protect, authorizeRoles('Student'), createLeaveRequest);
router.get('/leaves', protect, authorizeRoles('Student'), getMyLeaveRequests);

module.exports = router;
