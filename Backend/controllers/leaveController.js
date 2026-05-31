const asyncHandler = require('express-async-handler');
const Leave = require('../models/Leave');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

exports.createLeaveRequest = asyncHandler(async (req, res) => {
  const { fromDate, toDate, duration, leaveType, reason } = req.body;
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

  leave.status = status;
  leave.reviewedBy = req.user._id;
  await leave.save();

  res.status(200).json(leave);
});
