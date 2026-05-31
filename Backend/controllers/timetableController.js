const asyncHandler = require('express-async-handler');
const TimetableEntry = require('../models/TimetableEntry');
const LectureSession = require('../models/LectureSession');
const Teacher = require('../models/Teacher');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const AttendanceService = require('../services/attendanceService');
const { normalizeSessionType } = require('../utils/attendanceUtils');

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const parseTimeOnDate = (date, time) => {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};

const startOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (value) => {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
};

const isValidStatus = (status) => status === 'present' || status === 'absent';

const resolveSessionType = (startDateTime, endDateTime) => {
  const durationMinutes = Math.round((new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / 60000);
  return durationMinutes > 60 ? 'Practical' : 'Lecture';
};

const validateRecordsArray = (records) => {
  if (!Array.isArray(records) || records.length === 0) return false;
  return records.every((r) => r && r.student && isValidStatus(r.status));
};

exports.createTimetableEntry = asyncHandler(async (req, res) => {
  const {
    classroom,
    subject,
    plannedTeacher,
    dayOfWeek,
    startTime,
    endTime,
    validFrom,
    validTo,
    isActive = true
  } = req.body;

  if (!classroom || !subject || !plannedTeacher || dayOfWeek === undefined || !startTime || !endTime || !validFrom || !validTo) {
    res.status(400);
    throw new Error('Missing required timetable entry fields');
  }
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    res.status(400);
    throw new Error('startTime and endTime must be in HH:mm format');
  }
  if (startTime >= endTime) {
    res.status(400);
    throw new Error('startTime must be earlier than endTime');
  }

  const [teacher, room, subj] = await Promise.all([
    Teacher.findById(plannedTeacher).select('_id assignedClassrooms'),
    Classroom.findById(classroom).select('_id'),
    Subject.findById(subject).select('_id assignedTeacher')
  ]);

  if (!teacher || !room || !subj) {
    res.status(404);
    throw new Error('Teacher, classroom, or subject not found');
  }

  const classroomAllowed = teacher.assignedClassrooms.some((id) => id.toString() === room._id.toString());
  if (!classroomAllowed) {
    res.status(400);
    throw new Error('Planned teacher is not assigned to the selected classroom');
  }

  if (!subj.assignedTeacher || subj.assignedTeacher.toString() !== teacher._id.toString()) {
    res.status(400);
    throw new Error('Selected subject is not assigned to the planned teacher');
  }

  const entry = await TimetableEntry.create({
    classroom,
    subject,
    plannedTeacher,
    dayOfWeek,
    startTime,
    endTime,
    validFrom: startOfDay(validFrom),
    validTo: endOfDay(validTo),
    isActive: !!isActive,
    createdBy: req.user._id
  });

  const populated = await TimetableEntry.findById(entry._id)
    .populate('classroom', 'name year')
    .populate('subject', 'name code year')
    .populate('plannedTeacher', 'name email branch');

  res.status(201).json(populated);
});

exports.listTimetableEntries = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.classroom) query.classroom = req.query.classroom;
  if (req.query.subject) query.subject = req.query.subject;
  if (req.query.plannedTeacher) query.plannedTeacher = req.query.plannedTeacher;
  if (req.query.dayOfWeek !== undefined) query.dayOfWeek = Number(req.query.dayOfWeek);
  if (req.query.isActive !== undefined) query.isActive = String(req.query.isActive) === 'true';

  const entries = await TimetableEntry.find(query)
    .populate('classroom', 'name year')
    .populate('subject', 'name code year')
    .populate('plannedTeacher', 'name email branch')
    .sort({ dayOfWeek: 1, startTime: 1 });

  res.status(200).json(entries);
});

exports.generateSessionsForDate = asyncHandler(async (req, res) => {
  const { date } = req.body;
  if (!date) {
    res.status(400);
    throw new Error('date is required');
  }

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const dayOfWeek = dayStart.getDay();

  const entries = await TimetableEntry.find({
    dayOfWeek,
    isActive: true,
    validFrom: { $lte: dayEnd },
    validTo: { $gte: dayStart }
  });

  const generated = [];
  for (const entry of entries) {
    const startDateTime = parseTimeOnDate(dayStart, entry.startTime);
    const endDateTime = parseTimeOnDate(dayStart, entry.endTime);

    const session = await LectureSession.findOneAndUpdate(
      { timetableEntry: entry._id, date: dayStart },
      {
        $setOnInsert: {
          timetableEntry: entry._id,
          date: dayStart,
          startDateTime,
          endDateTime,
          classroom: entry.classroom,
          subject: entry.subject,
          plannedTeacher: entry.plannedTeacher,
          actualTeacher: null,
          status: 'planned'
        }
      },
      { upsert: true, new: true }
    );
    generated.push(session);
  }

  const ids = generated.map((s) => s._id);
  const populated = await LectureSession.find({ _id: { $in: ids } })
    .populate('classroom', 'name year')
    .populate('subject', 'name code year')
    .populate('plannedTeacher', 'name email branch')
    .populate('actualTeacher', 'name email branch')
    .sort({ startDateTime: 1 });

  res.status(200).json({ date: dayStart, count: populated.length, sessions: populated });
});

exports.listLectureSessions = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.classroom) query.classroom = req.query.classroom;
  if (req.query.subject) query.subject = req.query.subject;
  if (req.query.plannedTeacher) query.plannedTeacher = req.query.plannedTeacher;
  if (req.query.actualTeacher) query.actualTeacher = req.query.actualTeacher;
  if (req.query.status) query.status = req.query.status;
  if (req.query.date) {
    const dayStart = startOfDay(req.query.date);
    const dayEnd = endOfDay(req.query.date);
    query.date = { $gte: dayStart, $lte: dayEnd };
  }

  const sessions = await LectureSession.find(query)
    .populate('classroom', 'name year')
    .populate('subject', 'name code year')
    .populate('plannedTeacher', 'name email branch')
    .populate('actualTeacher', 'name email branch')
    .populate('substitutedBy', 'name email role')
    .sort({ date: -1, startDateTime: 1 });

  res.status(200).json(sessions);
});

exports.substituteLectureSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { actualTeacherId, reason = '' } = req.body;

  if (!actualTeacherId) {
    res.status(400);
    throw new Error('actualTeacherId is required');
  }

  const [session, teacher] = await Promise.all([
    LectureSession.findById(sessionId),
    Teacher.findById(actualTeacherId).select('_id assignedClassrooms')
  ]);

  if (!session) {
    res.status(404);
    throw new Error('Lecture session not found');
  }
  if (!teacher) {
    res.status(404);
    throw new Error('Substitute teacher not found');
  }

  const classroomAllowed = teacher.assignedClassrooms.some((id) => id.toString() === session.classroom.toString());
  if (!classroomAllowed) {
    res.status(400);
    throw new Error('Substitute teacher is not assigned to this classroom');
  }

  session.actualTeacher = teacher._id;
  session.status = 'substituted';
  session.substitutionReason = reason;
  session.substitutedBy = req.user._id;
  await session.save();

  const populated = await LectureSession.findById(session._id)
    .populate('classroom', 'name year')
    .populate('subject', 'name code year')
    .populate('plannedTeacher', 'name email branch')
    .populate('actualTeacher', 'name email branch')
    .populate('substitutedBy', 'name email role');

  res.status(200).json(populated);
});

exports.getTeacherTodaySessions = asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const sessions = await LectureSession.find({
    date: { $gte: dayStart, $lte: dayEnd },
    status: { $ne: 'cancelled' },
    $or: [
      { actualTeacher: req.user._id },
      { actualTeacher: null, plannedTeacher: req.user._id }
    ]
  })
    .populate('classroom', 'name year')
    .populate('subject', 'name code year')
    .populate('plannedTeacher', 'name email branch')
    .populate('actualTeacher', 'name email branch')
    .sort({ startDateTime: 1 });

  res.status(200).json(sessions);
});

exports.markSessionAttendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { records } = req.body;

  if (!validateRecordsArray(records)) {
    res.status(400);
    throw new Error('records must be a non-empty array of { student, status } with status present|absent');
  }

  const session = await LectureSession.findById(sessionId);
  if (!session) {
    res.status(404);
    throw new Error('Lecture session not found');
  }
  if (session.status === 'cancelled') {
    res.status(400);
    throw new Error('Cannot mark attendance for a cancelled session');
  }

  const responsibleTeacherId = session.actualTeacher || session.plannedTeacher;
  if (responsibleTeacherId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Teacher is not assigned to this lecture session');
  }

  const uniqueStudentIds = [...new Set(records.map((r) => r.student.toString()))];
  if (uniqueStudentIds.length !== records.length) {
    res.status(400);
    throw new Error('Duplicate student entries found in attendance records');
  }

  const studentsInClassroom = await Student.countDocuments({ _id: { $in: uniqueStudentIds }, classroom: session.classroom });
  if (studentsInClassroom !== uniqueStudentIds.length) {
    res.status(400);
    throw new Error('One or more students do not belong to this lecture session classroom');
  }

  let attendance = await Attendance.findOne({ lectureSession: session._id });
  if (!attendance) {
    attendance = await Attendance.create({
      lectureSession: session._id,
      date: session.startDateTime,
      classroom: session.classroom,
      subject: session.subject,
      sessionType: resolveSessionType(session.startDateTime, session.endDateTime),
      startTime: session.startDateTime.toTimeString().slice(0, 5),
      endTime: session.endDateTime.toTimeString().slice(0, 5),
      teacher: req.user._id,
      records
    });
  } else {
    attendance.records = records;
    attendance.teacher = req.user._id;
    attendance.sessionType = resolveSessionType(session.startDateTime, session.endDateTime);
    attendance.startTime = session.startDateTime.toTimeString().slice(0, 5);
    attendance.endTime = session.endDateTime.toTimeString().slice(0, 5);
    await attendance.save();
  }

  session.status = 'completed';
  await session.save();
  await AttendanceService.recalculateForClassroom(session.classroom, session.subject);

  const populated = await Attendance.findById(attendance._id)
    .populate('lectureSession')
    .populate('classroom', 'name year')
    .populate('subject', 'name code year')
    .populate('teacher', 'name email');

  res.status(200).json(populated);
});

exports.getStudentLectureAttendance = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const query = {
    lectureSession: { $ne: null },
    'records.student': userId
  };

  if (req.query.from || req.query.to) {
    query.date = {};
    if (req.query.from) query.date.$gte = startOfDay(req.query.from);
    if (req.query.to) query.date.$lte = endOfDay(req.query.to);
  }

  const rows = await Attendance.find(query)
    .populate({
      path: 'lectureSession',
      populate: [
        { path: 'classroom', select: 'name year' },
        { path: 'subject', select: 'name code year' },
        { path: 'plannedTeacher', select: 'name email' },
        { path: 'actualTeacher', select: 'name email' }
      ]
    })
    .sort({ date: -1 });

  const data = rows.map((attendance) => {
    const rec = attendance.records.find((r) => r.student.toString() === userId.toString());
    return {
      attendanceId: attendance._id,
      status: rec ? rec.status : 'absent',
      date: attendance.date,
      lectureSession: attendance.lectureSession
    };
  });

  res.status(200).json(data);
});
