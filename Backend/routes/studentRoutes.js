const express = require('express');
const router = express.Router();
const { getAttendance } = require('../controllers/studentController');
const { createLeaveRequest, getMyLeaveRequests } = require('../controllers/leaveController');
const { uploadLeaveAttachment } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { uploadLeaveAttachment: uploadMiddleware } = require('../middleware/uploadMiddleware');

router.get('/attendance', protect, authorizeRoles('Student'), getAttendance);
router.post('/leaves', protect, authorizeRoles('Student'), createLeaveRequest);
router.get('/leaves', protect, authorizeRoles('Student'), getMyLeaveRequests);
router.post('/leaves/attachment', protect, authorizeRoles('Student'), uploadMiddleware.single('attachment'), uploadLeaveAttachment);

module.exports = router;
