const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const TimetableEntry = require('../models/TimetableEntry');
const AttendanceService = require('../services/attendanceService');

const isValidStatus = (status) => status === 'present' || status === 'absent';

const validateRecordsArray = (records) => {
  if (!Array.isArray(records) || records.length === 0) return false;
  return records.every((r) => r && r.student && isValidStatus(r.status));
};

const resolveTeacherClassroomIds = async (teacherId) => {
  const teacher = await Teacher.findById(teacherId).select('assignedClassrooms');
  if (!teacher) return [];

  const directClassrooms = Array.isArray(teacher.assignedClassrooms)
    ? teacher.assignedClassrooms.map((id) => id.toString())
    : [];

  if (directClassrooms.length) return [...new Set(directClassrooms)];

  const timetableClassrooms = await TimetableEntry.distinct('classroom', { plannedTeacher: teacherId });
  return [...new Set(timetableClassrooms.map((id) => id.toString()))];
};

exports.markAttendance = asyncHandler(async (req, res) => {
  const { date, classroom, subject, records } = req.body;
  if (!date || !classroom || !subject || !records) {
    res.status(400);
    throw new Error('Missing attendance payload');
  }
  if (!validateRecordsArray(records)) {
    res.status(400);
    throw new Error('records must be a non-empty array of { student, status } with status present|absent');
  }

  if (req.user.role === 'Teacher') {
    const allowedClassroomIds = await resolveTeacherClassroomIds(req.user._id);
    if (!allowedClassroomIds.length) {
      res.status(404);
      throw new Error('Teacher not found');
    }
    const allowed = allowedClassroomIds.some((id) => id.toString() === classroom.toString());
    if (!allowed) {
      res.status(403);
      throw new Error('Teacher is not assigned to this classroom');
    }

    const assignedSubject = await Subject.findOne({ _id: subject, assignedTeacher: req.user._id }).select('_id');
    if (!assignedSubject) {
      res.status(403);
      throw new Error('Teacher is not assigned to this subject');
    }
  }

  // Ensure all students in payload belong to the selected classroom.
  const uniqueStudentIds = [...new Set(records.map((r) => r.student.toString()))];
  if (uniqueStudentIds.length !== records.length) {
    res.status(400);
    throw new Error('Duplicate student entries found in attendance records');
  }
  const studentsInClassroom = await Student.countDocuments({ _id: { $in: uniqueStudentIds }, classroom });
  if (studentsInClassroom !== uniqueStudentIds.length) {
    res.status(400);
    throw new Error('One or more students do not belong to the selected classroom');
  }

  // create attendance; unique index prevents duplicates for same date/class/subject
  let attendance;
  try {
    attendance = await Attendance.create({
      date: new Date(date),
      classroom,
      subject,
      teacher: req.user._id,
      records
    });
  } catch (err) {
    if (err && err.code === 11000) {
      res.status(409);
      throw new Error('Attendance already exists for this date, classroom, and subject');
    }
    throw err;
  }
  // update aggregated stats if needed via service
  await AttendanceService.recalculateForClassroom(classroom, subject);
  res.status(201).json(attendance);
});

exports.updateAttendance = asyncHandler(async (req, res) => {
  const { attendanceId } = req.params;
  const { records } = req.body;
  if (!validateRecordsArray(records)) {
    res.status(400);
    throw new Error('records must be a non-empty array of { student, status } with status present|absent');
  }
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

  const uniqueStudentIds = [...new Set(records.map((r) => r.student.toString()))];
  if (uniqueStudentIds.length !== records.length) {
    res.status(400);
    throw new Error('Duplicate student entries found in attendance records');
  }
  const studentsInClassroom = await Student.countDocuments({ _id: { $in: uniqueStudentIds }, classroom: attendance.classroom });
  if (studentsInClassroom !== uniqueStudentIds.length) {
    res.status(400);
    throw new Error('One or more students do not belong to this attendance classroom');
  }

  attendance.records = records;
  await attendance.save();
  await AttendanceService.recalculateForClassroom(attendance.classroom, attendance.subject);
  res.json(attendance);
});

exports.patchAttendance = asyncHandler(async (req, res) => {
  const { attendanceId } = req.params;
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0 || records.some((r) => !r || !r.student || !isValidStatus(r.status))) {
    res.status(400);
    throw new Error('Invalid or missing records array for patch');
  }
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) {
    res.status(404);
    throw new Error('Attendance record not found');
  }
  // restrict: only teacher who created or Admin can patch
  if (attendance.teacher.toString() !== req.user._id.toString() && req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
    res.status(403);
    throw new Error('Forbidden');
  }

  const uniqueStudentIds = [...new Set(records.map((r) => r.student.toString()))];
  if (uniqueStudentIds.length !== records.length) {
    res.status(400);
    throw new Error('Duplicate student entries found in attendance records patch');
  }
  const studentsInClassroom = await Student.countDocuments({ _id: { $in: uniqueStudentIds }, classroom: attendance.classroom });
  if (studentsInClassroom !== uniqueStudentIds.length) {
    res.status(400);
    throw new Error('One or more students do not belong to this attendance classroom');
  }

  // Merge incoming records: update matching student entries and append new ones
  const incomingMap = {};
  records.forEach(r => {
    if (!r.student) return;
    incomingMap[r.student.toString()] = r.status;
  });

  // Update existing records
  attendance.records = attendance.records.map(r => {
    const sid = r.student.toString();
    if (Object.prototype.hasOwnProperty.call(incomingMap, sid)) {
      r.status = incomingMap[sid];
      delete incomingMap[sid];
    }
    return r;
  });

  // Append any remaining incoming records
  for (const [studentId, status] of Object.entries(incomingMap)) {
    attendance.records.push({ student: studentId, status });
  }

  await attendance.save();
  await AttendanceService.recalculateForClassroom(attendance.classroom, attendance.subject);
  res.json(attendance);
});

exports.getTeacherAttendanceRecords = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const query = req.user.role === 'Teacher' ? { teacher: teacherId } : {};
  if (req.query.classroom) query.classroom = req.query.classroom;
  if (req.query.subject) query.subject = req.query.subject;
  if (req.query.lectureSession) query.lectureSession = req.query.lectureSession;
  if (req.query.date) {
    const day = new Date(req.query.date);
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  }

  const records = await Attendance.find(query)
    .populate('classroom', 'name')
    .populate('subject', 'name code')
    .populate('teacher', 'name email')
    .populate('lectureSession')
    .populate('records.student', 'name rollNo prn className division')
    .sort({ date: -1 });
  res.status(200).json(records);
});

exports.getStudentsForClassroom = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;

  if (req.user.role === 'Teacher') {
    const allowedClassroomIds = await resolveTeacherClassroomIds(req.user._id);
    if (!allowedClassroomIds.length) {
      res.status(404);
      throw new Error('Teacher not found');
    }
    const allowed = allowedClassroomIds.some((id) => id.toString() === classroomId.toString());
    if (!allowed) {
      res.status(403);
      throw new Error('Teacher is not assigned to this classroom');
    }
  }

  const students = await Student.find({ classroom: classroomId })
    .select('_id name prn rollNo className division branch classroom')
    .sort({ rollNo: 1, name: 1 });

  res.status(200).json(students);
});

exports.getTeacherDashboard = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.user._id)
    .select('-password')
    .populate('assignedClassrooms', 'name year');

  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  const fallbackClassroomIds = await resolveTeacherClassroomIds(req.user._id);
  const classroomDocs = fallbackClassroomIds.length
    ? await Student.db.model('Classroom').find({ _id: { $in: fallbackClassroomIds } }).select('name year')
    : (Array.isArray(teacher.assignedClassrooms) ? teacher.assignedClassrooms : []);

  const assignedSubjects = await Subject.find({ assignedTeacher: req.user._id })
    .populate('assignedTeacher', 'name email branch')
    .sort({ name: 1, code: 1 });

  const studentEntries = await Promise.all(
    (Array.isArray(classroomDocs) ? classroomDocs : []).map(async (classroom) => {
      const students = await Student.find({ classroom: classroom._id })
        .select('_id name prn rollNo className division branch classroom')
        .sort({ rollNo: 1, name: 1 });
      return [classroom._id.toString(), students];
    })
  );

  const studentsByClassroom = studentEntries.reduce((acc, [classroomId, students]) => {
    acc[classroomId] = students;
    return acc;
  }, {});

  const canMarkAttendance = Array.isArray(teacher.assignedClassrooms) && teacher.assignedClassrooms.length > 0 && assignedSubjects.length > 0;

  const attendanceRecords = await Attendance.find({ teacher: req.user._id })
    .populate('classroom', 'name year')
    .populate('subject', 'name code year assignedTeacher')
    .sort({ date: -1 })
    .limit(10);

  res.status(200).json({
    teacher,
    assignedClassrooms: classroomDocs,
    assignedSubjects,
    studentsByClassroom,
    attendanceRecords,
    canMarkAttendance,
    sourceOfTruth: 'subject.assignedTeacher'
  });
});

exports.getAttendanceContext = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.user._id)
    .select('-password')
    .populate('assignedClassrooms', 'name year');

  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  const fallbackClassroomIds = await resolveTeacherClassroomIds(req.user._id);
  const assignedClassrooms = fallbackClassroomIds.length
    ? await Student.db.model('Classroom').find({ _id: { $in: fallbackClassroomIds } }).select('name year')
    : (Array.isArray(teacher.assignedClassrooms) ? teacher.assignedClassrooms : []);
  const assignedSubjects = await Subject.find({ assignedTeacher: req.user._id })
    .populate('assignedTeacher', 'name email branch')
    .sort({ name: 1, code: 1 });

  const studentEntries = await Promise.all(
    assignedClassrooms.map(async (classroom) => {
      const students = await Student.find({ classroom: classroom._id })
        .select('_id name prn rollNo className division branch classroom')
        .sort({ rollNo: 1, name: 1 });
      return [classroom._id.toString(), students];
    })
  );

  const studentsByClassroom = studentEntries.reduce((acc, [classroomId, students]) => {
    acc[classroomId] = students;
    return acc;
  }, {});

  res.status(200).json({
    teacher,
    assignedClassrooms,
    assignedSubjects,
    studentsByClassroom,
    canMarkAttendance: assignedClassrooms.length > 0 && assignedSubjects.length > 0
  });
});

// Debug helper: return teacher doc + related data for the logged-in teacher
exports.getTeacherDebug = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.user._id)
    .select('-password')
    .populate('assignedClassrooms', 'name year');

  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  const assignedSubjects = await Subject.find({ assignedTeacher: req.user._id }).sort({ name: 1 });

  const studentEntries = await Promise.all(
    (Array.isArray(teacher.assignedClassrooms) ? teacher.assignedClassrooms : []).map(async (classroom) => {
      const students = await Student.find({ classroom: classroom._id }).select('_id name prn rollNo className division branch classroom');
      return [classroom._id.toString(), students];
    })
  );

  const studentsByClassroom = studentEntries.reduce((acc, [classroomId, students]) => {
    acc[classroomId] = students;
    return acc;
  }, {});

  res.status(200).json({ teacher, assignedSubjects, studentsByClassroom });
});
