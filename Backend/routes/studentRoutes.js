const express = require('express');
const router = express.Router();
const { getAttendance } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/attendance', protect, authorizeRoles('Student'), getAttendance);

module.exports = router;
