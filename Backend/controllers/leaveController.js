const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const LectureSession = require('../models/LectureSession');
const Classroom = require('../models/Classroom');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const AttendanceService = require('../services/attendanceService');
const { doesLeaveCoverAttendance, toDateRange, applyLeaveToAttendanceRecords, normalizeLeaveDuration } = require('../utils/leaveAttendanceUtils');

const isPastDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
};

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

const getLeaveRecipientTeachers = async (leave) => {
  const dateRange = toDateRange(leave.fromDate, leave.toDate);
  if (!dateRange) return [];

  const attendanceRecords = await Attendance.find({
    classroom: leave.classroom,
    date: { $gte: dateRange.start, $lte: dateRange.end }
  })
    .select('teacher date sessionType startTime endTime classroom subject')
    .populate('teacher', 'name email role');

  const recipients = new Map();
  for (const attendance of attendanceRecords) {
    if (!doesLeaveCoverAttendance({
      duration: leave.duration,
      sessionType: attendance.sessionType,
      startTime: attendance.startTime,
      endTime: attendance.endTime
    })) {
      continue;
    }

    const teacher = attendance.teacher;
    if (teacher && teacher._id) {
      recipients.set(teacher._id.toString(), teacher);
    }
  }

  return [...recipients.values()];
};

exports.createLeaveRequest = asyncHandler(async (req, res) => {
  const { leaveDate, fromDate, toDate, duration, leaveType, reason, attachmentUrl, attachmentPublicId, attachmentName, attachmentType, attachmentSize } = req.body;
  const resolvedFromDate = leaveDate || fromDate;
  const resolvedToDate = leaveDate || toDate;
  const resolvedDuration = normalizeLeaveDuration(duration);

  if (!resolvedFromDate || !resolvedToDate) {
    res.status(400);
    throw new Error('leaveDate or fromDate/toDate are required');
  }

  if (!isPastDateOnly(resolvedFromDate) || !isPastDateOnly(resolvedToDate)) {
    res.status(400);
    throw new Error('Leave requests can only be submitted for past dates');
  }

  if (new Date(resolvedToDate).getTime() < new Date(resolvedFromDate).getTime()) {
    res.status(400);
    throw new Error('toDate must be on or after fromDate');
  }

  if (!Array.isArray(resolvedDuration) || !resolvedDuration.length) {
    res.status(400);
    throw new Error('Invalid leave time slot');
  }

  const student = await Student.findById(req.user._id).select('classroom');
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const leave = await Leave.create({
    student: student._id,
    classroom: student.classroom,
    fromDate: new Date(resolvedFromDate),
    toDate: new Date(resolvedToDate),
    duration: resolvedDuration,
    leaveType,
    reason,
    attachmentUrl,
    attachmentPublicId,
    attachmentName,
    attachmentType,
    attachmentSize,
    status: 'Pending'
  });

  const recipients = await getLeaveRecipientTeachers(leave);
  const studentDoc = await Student.findById(student._id).select('name rollNo prn className division email classroom');
  const classroomDoc = await Classroom.findById(student.classroom).select('name year');

  res.status(201).json(leave);

  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('leave:new', {
        leaveId: leave._id,
        recipientTeacherIds: recipients.map((teacher) => teacher._id.toString()),
        teacherEmails: recipients.map((teacher) => teacher.email).filter(Boolean),
        student: studentDoc,
        classroom: classroomDoc,
        leave: {
          _id: leave._id,
          fromDate: leave.fromDate,
          toDate: leave.toDate,
          duration: leave.duration,
          leaveType: leave.leaveType,
          reason: leave.reason,
          attachmentUrl: leave.attachmentUrl,
          attachmentName: leave.attachmentName,
          status: leave.status,
          createdAt: leave.createdAt
        }
      });
    }
  } catch (error) {
    console.warn('Failed to emit leave creation event', error && error.message);
  }
});

exports.getMyLeaveRequests = asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate('student', 'name rollNo prn email className division')
    .populate('classroom', 'name year')
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
