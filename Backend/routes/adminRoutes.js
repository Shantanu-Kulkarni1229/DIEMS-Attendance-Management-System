const express = require('express');
const router = express.Router();
const { createAdmin, createTeacher, createStudent, assignTeacherToSubject, getTeachers, getStudents, getClassrooms, getSubjects } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// SuperAdmin only - create admins
router.post('/create-admin', protect, authorizeRoles('SuperAdmin'), createAdmin);

// Admin & SuperAdmin - create teachers and students
router.post('/create-teacher', protect, authorizeRoles('SuperAdmin', 'Admin'), createTeacher);
router.post('/create-student', protect, authorizeRoles('SuperAdmin', 'Admin'), createStudent);
router.post('/assign-teacher-subject', protect, authorizeRoles('SuperAdmin', 'Admin'), assignTeacherToSubject);

// Get resources
router.get('/teachers', protect, authorizeRoles('SuperAdmin', 'Admin'), getTeachers);
router.get('/students', protect, authorizeRoles('SuperAdmin', 'Admin'), getStudents);
router.get('/classrooms', protect, authorizeRoles('SuperAdmin', 'Admin', 'Teacher', 'Student'), getClassrooms);
router.get('/subjects', protect, authorizeRoles('SuperAdmin', 'Admin', 'Teacher', 'Student'), getSubjects);

module.exports = router;
