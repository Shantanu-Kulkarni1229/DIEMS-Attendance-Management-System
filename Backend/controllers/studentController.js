const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const AttendanceCredit = require('../models/AttendanceCredit');
const Student = require('../models/Student');
const AttendanceUtils = require('../utils/attendanceUtils');

exports.getAttendance = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const student = await Student.findById(userId).populate('classroom');
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  // fetch attendance records where student appears
  const records = await Attendance.find({ 'records.student': userId }).populate('subject');
  const credits = await AttendanceCredit.find({ student: userId }).populate('subject');
  const summary = AttendanceUtils.calculateStudentAttendance(userId, records, credits);
  res.json({ classroom: student.classroom, attendance: summary });
});
