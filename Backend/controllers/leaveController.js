const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const LectureSession = require('../models/LectureSession');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const TimetableEntry = require('../models/TimetableEntry');
const AttendanceService = require('../services/attendanceService');

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const toMinutes = (value) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const deriveSessionType = (startTime, endTime) => {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  const duration = startMinutes !== null && endMinutes !== null ? endMinutes - startMinutes : 0;
  return duration > 90 ? 'Practical' : 'Lecture';
};

const getDatesBetween = (fromDate, toDate) => {
  const start = startOfDay(fromDate);
  const end = endOfDay(toDate);
  const dates = [];
  for (const current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    dates.push(new Date(current));
  }
  return dates;
};

const matchesHalfDay = (session, duration) => {
  if (duration === 'Full Day') return true;
  const hour = new Date(session.startDateTime).getHours();
  if (duration === '1st Half') return hour < 12;
  if (duration === '2nd Half') return hour >= 12;
  return true;
};

const buildFallbackTargets = async (leave) => {
  const timetableEntries = await TimetableEntry.find({
    classroom: leave.classroom,
    isActive: true,
    validFrom: { $lte: endOfDay(leave.toDate) },
    validTo: { $gte: startOfDay(leave.fromDate) }
  })
    .populate('subject', 'name code year')
    .populate('plannedTeacher', 'name email branch')
    .sort({ dayOfWeek: 1, startTime: 1 });

  const targets = [];
  for (const date of getDatesBetween(leave.fromDate, leave.toDate)) {
    const dayOfWeek = date.getDay();
    for (const entry of timetableEntries) {
      if (entry.dayOfWeek !== dayOfWeek) continue;
      if (leave.duration === '1st Half' && toMinutes(entry.startTime) >= 12 * 60) continue;
      if (leave.duration === '2nd Half' && toMinutes(entry.startTime) < 12 * 60) continue;

      const start = new Date(date);
      const [startHour, startMinute] = entry.startTime.split(':').map(Number);
      start.setHours(startHour, startMinute, 0, 0);

      const end = new Date(date);
      const [endHour, endMinute] = entry.endTime.split(':').map(Number);
      end.setHours(endHour, endMinute, 0, 0);

      targets.push({
        lectureSession: null,
        date: new Date(date),
        startDateTime: start,
        endDateTime: end,
        classroom: entry.classroom,
        subject: entry.subject,
        plannedTeacher: entry.plannedTeacher,
        actualTeacher: null,
        session: null
      });
    }
  }

  return targets;
};

const buildTargetsForLeave = async (leave) => {
  const lectureSessions = await LectureSession.find({
    classroom: leave.classroom,
    date: { $gte: startOfDay(leave.fromDate), $lte: endOfDay(leave.toDate) },
    status: { $ne: 'cancelled' }
  })
    .populate('classroom', 'name year')
    .populate('subject', 'name code year')
    .populate('plannedTeacher', 'name email branch')
    .populate('actualTeacher', 'name email branch')
    .sort({ startDateTime: 1 });

  const filteredSessions = lectureSessions.filter((session) => matchesHalfDay(session, leave.duration));
  if (filteredSessions.length) {
    return filteredSessions.map((session) => ({
      lectureSession: session._id,
      date: session.startDateTime,
      startDateTime: session.startDateTime,
      endDateTime: session.endDateTime,
      classroom: session.classroom,
      subject: session.subject,
      plannedTeacher: session.plannedTeacher,
      actualTeacher: session.actualTeacher || session.plannedTeacher,
      session
    }));
  }

  return buildFallbackTargets(leave);
};

const markAttendanceForLeave = async (leave, reviewerId) => {
  const students = await Student.find({ classroom: leave.classroom }).select('_id');
  if (!students.length) return [];

  const targets = await buildTargetsForLeave(leave);
  const affected = [];

  for (const target of targets) {
    const responsibleTeacherId = target.actualTeacher || target.plannedTeacher || reviewerId;
    const startTime = target.startDateTime.toTimeString().slice(0, 5);
    const endTime = target.endDateTime.toTimeString().slice(0, 5);
    const records = students.map((student) => ({
      student: student._id,
      status: student._id.toString() === leave.student.toString() ? 'absent' : 'present'
    }));

    const attendanceQuery = target.lectureSession
      ? { lectureSession: target.lectureSession }
      : {
          date: target.date,
          classroom: target.classroom,
          subject: target.subject,
          sessionType: deriveSessionType(startTime, endTime),
          startTime,
          endTime
        };

    let attendance = await Attendance.findOne(attendanceQuery);
    if (!attendance) {
      attendance = await Attendance.create({
        lectureSession: target.lectureSession || null,
        date: target.date,
        classroom: target.classroom,
        subject: target.subject,
        sessionType: deriveSessionType(startTime, endTime),
        startTime,
        endTime,
        teacher: responsibleTeacherId,
        records
      });
    } else {
      const recordMap = new Map((Array.isArray(attendance.records) ? attendance.records : []).map((record) => [record.student.toString(), record.status]));
      records.forEach((record) => recordMap.set(record.student.toString(), record.status));
      attendance.records = Array.from(recordMap.entries()).map(([studentId, status]) => ({ student: studentId, status }));
      attendance.teacher = responsibleTeacherId;
      attendance.sessionType = deriveSessionType(startTime, endTime);
      attendance.startTime = startTime;
      attendance.endTime = endTime;
      if (!attendance.lectureSession && target.lectureSession) attendance.lectureSession = target.lectureSession;
      await attendance.save();
    }

    if (target.session) {
      target.session.status = 'completed';
      await target.session.save();
    }

    await AttendanceService.recalculateForClassroom(attendance.classroom, attendance.subject);
    affected.push(attendance);
  }

  return affected;
};

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

  if (status === 'Approved') {
    await markAttendanceForLeave(leave, req.user._id);
  }

  leave.status = status;
  leave.reviewedBy = req.user._id;
  await leave.save();

  const populated = await Leave.findById(leave._id)
    .populate('student', 'name rollNo className division email')
    .populate('classroom', 'name year')
    .populate('reviewedBy', 'name email role');

  res.status(200).json(populated);
});
