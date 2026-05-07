const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const AttendanceService = require('../services/attendanceService');

exports.markAttendance = asyncHandler(async (req, res) => {
  const { date, classroom, subject, records } = req.body;
  if (!date || !classroom || !subject || !records) {
    res.status(400);
    throw new Error('Missing attendance payload');
  }
  // create attendance; unique index prevents duplicates for same date/class/subject
  const attendance = await Attendance.create({
    date: new Date(date),
    classroom,
    subject,
    teacher: req.user._id,
    records
  });
  // update aggregated stats if needed via service
  await AttendanceService.recalculateForClassroom(classroom, subject);
  res.status(201).json(attendance);
});

exports.updateAttendance = asyncHandler(async (req, res) => {
  const { attendanceId } = req.params;
  const { records } = req.body;
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) {
    res.status(404);
    throw new Error('Attendance record not found');
  }
  // restrict: only teacher who created or Admin can update
  if (attendance.teacher.toString() !== req.user._id.toString() && req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
    res.status(403);
    throw new Error('Forbidden');
  }
  attendance.records = records;
  await attendance.save();
  await AttendanceService.recalculateForClassroom(attendance.classroom, attendance.subject);
  res.json(attendance);
});

exports.getTeacherAttendanceRecords = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const records = await Attendance.find({ teacher: teacherId })
    .populate('classroom', 'name')
    .populate('subject', 'name code')
    .sort({ date: -1 });
  res.status(200).json(records);
});

exports.getTeacherDashboard = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.user._id)
    .select('-password')
    .populate('assignedClassrooms', 'name year');

  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  const assignedSubjects = await Subject.find({ assignedTeacher: req.user._id })
    .populate('assignedTeacher', 'name email branch')
    .sort({ name: 1, code: 1 });

  const attendanceRecords = await Attendance.find({ teacher: req.user._id })
    .populate('classroom', 'name year')
    .populate('subject', 'name code year assignedTeacher')
    .sort({ date: -1 })
    .limit(10);

  res.status(200).json({
    teacher,
    assignedSubjects,
    attendanceRecords,
    sourceOfTruth: 'subject.assignedTeacher'
  });
});
