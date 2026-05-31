const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const LectureSession = require('../models/LectureSession');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const AttendanceService = require('../services/attendanceService');
const { doesLeaveCoverAttendance, toDateRange, applyLeaveToAttendanceRecords } = require('../utils/leaveAttendanceUtils');

const syncApprovedLeaveToAttendance = async (leave) => {
  const dateRange = toDateRange(leave.fromDate, leave.toDate);
  if (!dateRange) return;

  const attendanceRecords = await Attendance.find({
    classroom: leave.classroom,
    date: { $gte: dateRange.start, $lte: dateRange.end }
  });

  for (const attendance of attendanceRecords) {
    if (!doesLeaveCoverAttendance({
      duration: leave.duration,
      sessionType: attendance.sessionType,
      startTime: attendance.startTime,
      endTime: attendance.endTime
    })) {
      continue;
    }

    const studentId = leave.student.toString();
    const hasMatchingRecord = Array.isArray(attendance.records)
      && attendance.records.some((record) => record.student && record.student.toString() === studentId);
    if (!hasMatchingRecord) continue;

    attendance.records = applyLeaveToAttendanceRecords(attendance.records, leave);
    await attendance.save();
    await AttendanceService.recalculateForClassroom(attendance.classroom, attendance.subject);
  }
};

exports.createLeaveRequest = asyncHandler(async (req, res) => {
  const { fromDate, toDate, duration, leaveType, reason, attachmentUrl, attachmentPublicId, attachmentName, attachmentType, attachmentSize } = req.body;
  if (!fromDate || !toDate) {
    res.status(400);
    throw new Error('fromDate and toDate are required');
  }

  const student = await Student.findById(req.user._id).select('classroom');
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const leave = await Leave.create({
    student: student._id,
    classroom: student.classroom,
    fromDate: new Date(fromDate),
    toDate: new Date(toDate),
    duration: duration || 'Full Day',
    leaveType,
    reason,
    attachmentUrl,
    attachmentPublicId,
    attachmentName,
    attachmentType,
    attachmentSize,
    status: 'Pending'
  });

  res.status(201).json(leave);
});

exports.getMyLeaveRequests = asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate('reviewedBy', 'name email role');
  res.status(200).json(leaves);
});

exports.getTeacherLeaveRequests = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'Teacher') {
    const teacher = await Teacher.findById(req.user._id).select('assignedClassrooms');
    if (!teacher) {
      res.status(404);
      throw new Error('Teacher not found');
    }
    query.classroom = { $in: teacher.assignedClassrooms };
  }

  if (req.query.status) query.status = req.query.status;

  const leaves = await Leave.find(query)
    .sort({ createdAt: -1 })
    .populate('student', 'name rollNo className division email')
    .populate('classroom', 'name year')
    .populate('reviewedBy', 'name email role');

  res.status(200).json(leaves);
});

exports.reviewLeaveRequest = asyncHandler(async (req, res) => {
  const { leaveId } = req.params;
  const { status } = req.body;

  if (!['Approved', 'Rejected'].includes(status)) {
    res.status(400);
    throw new Error('status must be Approved or Rejected');
  }

  const leave = await Leave.findById(leaveId);
  if (!leave) {
    res.status(404);
    throw new Error('Leave request not found');
  }

  if (req.user.role === 'Teacher') {
    const teacher = await Teacher.findById(req.user._id).select('assignedClassrooms');
    const allowed = teacher && teacher.assignedClassrooms.some((id) => id.toString() === String(leave.classroom));
    if (!allowed) {
      res.status(403);
      throw new Error('Teacher is not assigned to this classroom');
    }
  }

  if (status === 'Approved') {
    await markAttendanceForLeave(leave, req.user._id);
  }

  leave.status = status;
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  await leave.save();

  if (status === 'Approved') {
    await syncApprovedLeaveToAttendance(leave);
  }

  // Emit real-time update so students (and others) can see approval immediately
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('leave:updated', {
        _id: leave._id,
        status: leave.status,
        student: leave.student,
        classroom: leave.classroom,
        reviewedBy: leave.reviewedBy,
        reviewedAt: leave.reviewedAt,
        attachmentUrl: leave.attachmentUrl,
        attachmentName: leave.attachmentName
      });
    }
  } catch (e) {
    // non-fatal
    console.warn('Failed to emit leave update', e && e.message);
  }

  res.status(200).json(leave);
});
