const express = require('express');
const router = express.Router();
const { createTeacher, createStudent } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/create-teacher', protect, authorizeRoles('SuperAdmin', 'Admin'), createTeacher);
router.post('/create-student', protect, authorizeRoles('SuperAdmin', 'Admin'), createStudent);

module.exports = router;
