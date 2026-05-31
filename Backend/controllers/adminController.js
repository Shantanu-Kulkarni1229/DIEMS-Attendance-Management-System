const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const { sendTeacherCredentials } = require('../services/emailService');

const randomPassword = (len = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let out = '';
  for (let i = 0; i < len; i += 1) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
};

const normalizeYearToNumber = (value) => {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  const map = { FY: 1, SY: 2, TY: 3, BTECH: 4 };
  const key = String(value || '').toUpperCase();
  return map[key] || undefined;
};

const subjectAliasMap = {
  ML: 'Machine Learning',
  CN: 'Computer Networks',
  CD: 'Compiler Design',
  'E&SD': 'Engineering and Skill Development',
  IOT: 'Internet of Things',
  PRAC: 'Practical Subjects',
  CP: 'Competitive Programming',
  MLP: 'Machine Learning Practical',
  PD: 'Professional Development',
  DIY: 'Do It Yourself'
};

const canonicalSubjectName = (value) => {
  const raw = String(value || '').trim();
  const cleaned = raw.replace(/\s*\((Theory|Practical)\)\s*$/i, '').trim();
  return subjectAliasMap[cleaned.toUpperCase()] || cleaned;
};

const normalizedLookupName = (value) => canonicalSubjectName(value).replace(/^Lab - /i, '').trim().toLowerCase();

const parsePracticalBatchSize = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) return null;
  return parsed;
};

const normalizeIdList = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
};

const PRACTICAL_BATCH_LABELS = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'];

const normalizePracticalBatchLabel = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  const match = normalized.match(/^batch\s*([1-4])$/i);
  if (!match) return null;
  return `Batch ${match[1]}`;
};

const resolvePracticalBatchAssignments = async ({ practicalAssignments, subjectDocs, classroomDocs }) => {
  const assignments = Array.isArray(practicalAssignments) ? practicalAssignments : [];
  if (!assignments.length) return [];

  const subjectMapById = new Map(subjectDocs.map((subject) => [String(subject._id), subject]));
  const subjectMapByName = new Map(subjectDocs.map((subject) => [normalizedLookupName(subject.name), subject]));
  const subjectMapByLabel = new Map(subjectDocs.map((subject) => [String(subject.label || subject.name || '').trim().toLowerCase(), subject]));
  const classroomMapById = new Map(classroomDocs.map((classroom) => [String(classroom._id), classroom]));
  const classroomMapByName = new Map(classroomDocs.map((classroom) => [String(classroom.name || '').trim().toLowerCase(), classroom]));
  const resolvedAssignmentsByPair = new Map();

  for (const assignment of assignments) {
    const subjectId = String(assignment?.subjectId || assignment?.subject || '').trim();
    const classroomId = String(assignment?.classroomId || assignment?.classroom || '').trim();
    const batchIds = normalizeIdList(assignment?.batchIds);

    if (!subjectId || !classroomId || !batchIds.length) {
      throw new Error('Each practical batch assignment requires a subject, classroom, and at least one batch');
    }

    const subject = subjectMapById.get(subjectId)
      || subjectMapByName.get(normalizedLookupName(subjectId))
      || subjectMapByLabel.get(String(subjectId || '').trim().toLowerCase());
    if (!subject) {
      throw new Error('Practical batch assignments must use one of the selected subjects');
    }
    if ((subject.category || 'lecture') !== 'practical') {
      throw new Error('Practical batch assignments can only be added for practical subjects');
    }

    const classroom = classroomMapById.get(classroomId) || classroomMapByName.get(String(classroomId || '').trim().toLowerCase());
    if (!classroom) {
      throw new Error('Practical batch assignments must use one of the selected classrooms');
    }

    const normalizedBatchIds = batchIds.map(normalizePracticalBatchLabel).filter(Boolean);
    const invalidBatchIds = batchIds.filter((batchId) => !normalizePracticalBatchLabel(batchId));
    if (invalidBatchIds.length) {
      throw new Error(`Invalid practical batch selection: ${invalidBatchIds.join(', ')}`);
    }

    const pairKey = `${subject._id.toString()}:${classroom._id.toString()}`;
    const existingAssignment = resolvedAssignmentsByPair.get(pairKey);
    if (existingAssignment) {
      existingAssignment.batchIds = [...new Set([...existingAssignment.batchIds, ...normalizedBatchIds])];
      existingAssignment.batchSnapshot = existingAssignment.batchIds.map((batchId) => ({
        batchId,
        label: batchId,
        startRoll: '',
        endRoll: '',
        studentIds: [],
        studentCount: 0
      }));
      continue;
    }

    resolvedAssignmentsByPair.set(pairKey, {
      subject: subject._id,
      classroom: classroom._id,
      batchIds: normalizedBatchIds,
      batchSnapshot: normalizedBatchIds.map((batchId) => ({
        batchId,
        label: batchId,
        startRoll: '',
        endRoll: '',
        studentIds: [],
        studentCount: 0
      }))
    });
  }

  return Array.from(resolvedAssignmentsByPair.values());
};

const generateAutoPrn = () => `PRN${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

const emitAdminDashboardUpdate = (req, event, payload = {}) => {
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('admin:dashboard-updated', { event, ...payload });
    }
  } catch (error) {
    // Ignore socket failures; the API response is still valid.
  }
};

exports.createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, branch } = req.body;
  if (!branch) {
    res.status(400);
    throw new Error('Branch is required');
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }
  const admin = await Admin.create({
    name,
    email,
    password,
    branch,
    createdBy: req.user._id
  });
  res.status(201).json(admin);
});

exports.createTeacher = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    temporaryPassword,
    subjects = [],
    classrooms = [],
    yearClasses = [],
    practicalAssignments = []
  } = req.body;

  const teacherPassword = password || temporaryPassword || randomPassword();
  if (!name || !email) {
    res.status(400);
    throw new Error('name and email are required');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Process subjects: items may be existing subject IDs (string) or objects { name, year, category }
  const subjectIds = [];
  for (const subj of subjects) {
    if (typeof subj === 'string' && subj.match(/^[0-9a-fA-F]{24}$/)) {
      // treat as ObjectId
      const found = await Subject.findById(subj);
      if (!found) {
        res.status(400);
        throw new Error('One or more subjects not found');
      }
      subjectIds.push(found._id);
    } else if (subj && typeof subj === 'object' && subj.name) {
      // Try to find by name and year
      let queryName = canonicalSubjectName(subj.name);
      if (subj.category === 'practical' && !/^Lab - /i.test(queryName)) queryName = `Lab - ${queryName}`;
      const query = { name: queryName };
      const normalizedYear = normalizeYearToNumber(subj.year);
      if (normalizedYear) query.year = normalizedYear;
      if (subj.category) query.category = subj.category;
      let found = await Subject.findOne(query);
      if (!found) {
        found = await Subject.create({ name: query.name, year: normalizedYear, category: subj.category || 'lecture', createdBy: req.user._id });
      }
      subjectIds.push(found._id);
    } else if (typeof subj === 'string' && subj.trim()) {
      const isPractical = /\(Practical\)\s*$/i.test(subj);
      let cleanedName = canonicalSubjectName(subj);
      if (isPractical && !/^Lab - /i.test(cleanedName)) cleanedName = `Lab - ${cleanedName}`;
      let found = await Subject.findOne({ name: cleanedName });
      if (!found) {
        found = await Subject.create({ name: cleanedName, category: isPractical ? 'practical' : 'lecture', createdBy: req.user._id });
      }
      subjectIds.push(found._id);
    }
  }

  const selectedSubjects = subjectIds.length
    ? await Subject.find({ _id: { $in: subjectIds } }).select('_id name category').lean()
    : [];

  // Merge classroom IDs and yearClasses payload from frontend
  const classroomIds = [...classrooms];
  for (const yc of yearClasses) {
    if (!yc || !yc.class) continue;
    const classroomName = String(yc.class).trim();
    const classroomYear = yc.year ? String(yc.year).trim() : undefined;
    let foundClassroom = await Classroom.findOne({ name: classroomName });
    if (!foundClassroom) {
      foundClassroom = await Classroom.create({
        name: classroomName,
        year: classroomYear,
        practicalBatchSize: 20,
        createdBy: req.user._id
      });
    }
    classroomIds.push(foundClassroom._id);
  }

  const uniqueClassroomIds = [...new Set(classroomIds.map((id) => id.toString()))];
  const classroomDocs = uniqueClassroomIds.length
    ? await Classroom.find({ _id: { $in: uniqueClassroomIds } }).select('_id name year practicalBatchSize').lean()
    : [];

  // Validate classrooms exist (same as before)
  if (uniqueClassroomIds.length > 0) {
    if (classroomDocs.length !== uniqueClassroomIds.length) {
      res.status(400);
      throw new Error('One or more classrooms not found');
    }
  }

  const practicalSubjectIds = new Set(selectedSubjects.filter((subject) => (subject.category || 'lecture') === 'practical').map((subject) => subject._id.toString()));
  const normalizedPracticalAssignments = await resolvePracticalBatchAssignments({
    practicalAssignments,
    subjectDocs: selectedSubjects,
    classroomDocs
  }).catch((error) => {
    throw error;
  });

  if (practicalSubjectIds.size && !normalizedPracticalAssignments.length) {
    res.status(400);
    throw new Error('Practical subjects require at least one practical batch assignment');
  }

  const teacher = await Teacher.create({
    name,
    email,
    password: teacherPassword,
    mustChangePassword: true,
    branch: req.user.branch, // inherit admin's branch
    assignedClassrooms: uniqueClassroomIds,
    practicalBatchAssignments: normalizedPracticalAssignments,
    createdBy: req.user._id
  });

  // Send email with credentials
    const loginLink = process.env.FRONTEND_URL || 'http://localhost:5173';
    try {
      await sendTeacherCredentials({
        teacherEmail: email,
        teacherName: name,
        temporaryPassword: teacherPassword,
        loginLink: loginLink
      });
    } catch (emailError) {
      console.error('Failed to send credentials email:', emailError);
      // Don't throw - teacher is already created, just log the error
    }

  await Subject.updateMany(
    { _id: { $in: subjectIds } },
    { $set: { assignedTeacher: teacher._id } }
  );

  emitAdminDashboardUpdate(req, 'teacher-created', { teacherId: teacher._id, teacherName: teacher.name });
  res.status(201).json(teacher);
});

exports.assignTeacherToSubject = asyncHandler(async (req, res) => {
  const { teacherId, subjectId } = req.body;
  if (!teacherId || !subjectId) {
    res.status(400);
    throw new Error('teacherId and subjectId are required');
  }

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    res.status(404);
    throw new Error('Subject not found');
  }

  // Link subject -> teacher (single source of truth). No teacher.assignedSubjects manipulation.
  subject.assignedTeacher = teacher._id;
  await subject.save();

  emitAdminDashboardUpdate(req, 'subject-assigned', { teacherId: teacher._id, subjectId: subject._id });

  res.status(200).json({
    message: 'Teacher assigned to subject successfully',
    teacher,
    subject
  });
});

exports.createStudent = asyncHandler(async (req, res) => {
  const {
    prn,
    collegePrn,
    batuPrn,
    rollNo,
    name,
    firstName,
    lastName,
    email,
    password,
    temporaryPassword,
    className,
    classSemester,
    division,
    classroom,
    phone,
    studentMobile,
    parentMobile,
    parentEmail
  } = req.body;

  const resolvedName = name || [firstName, lastName].filter(Boolean).join(' ').trim();
  const resolvedClassName = className || classSemester;
  const resolvedDivision = division || 'A';
  const resolvedPrn = prn || generateAutoPrn();
  const studentPassword = password || temporaryPassword || randomPassword();

  if (!resolvedName || !email || !rollNo || !resolvedClassName) {
    res.status(400);
    throw new Error('name, email, rollNo, and className are required');
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }
  const prnExists = await Student.findOne({ prn: resolvedPrn });
  if (prnExists) {
    res.status(400);
    throw new Error('Student with this PRN already exists');
  }
  const room = classroom ? await Classroom.findById(classroom) : null;
  const student = await Student.create({
    prn: resolvedPrn,
    collegePrn,
    batuPrn,
    rollNo,
    name: resolvedName,
    email,
    password: studentPassword,
    mustChangePassword: true,
    className: resolvedClassName,
    division: resolvedDivision,
    phone,
    studentMobile,
    parentMobile,
    parentEmail,
    branch: req.user.branch, // inherit admin's branch
    classroom: room ? room._id : undefined,
    createdBy: req.user._id
  });
  emitAdminDashboardUpdate(req, 'student-created', { studentId: student._id, studentName: student.name });
  res.status(201).json(student);
});

exports.getTeachers = asyncHandler(async (req, res) => {
  // SuperAdmin sees all teachers.
  // Admins should see:
  // - teachers they created, OR
  // - teachers in their branch, OR
  // - legacy/imported teachers that don't have a createdBy set.
  let filter;
  if (req.user.role === 'SuperAdmin') {
    filter = {};
  } else {
    const branch = req.user.branch;
    const orClauses = [ { createdBy: req.user._id }, { createdBy: { $exists: false } }, { createdBy: null } ];
    if (branch) orClauses.push({ branch });
    filter = { $or: orClauses };
  }
  const teachers = await Teacher.find(filter)
    .select('-password')
    .populate('assignedClassrooms', 'name year practicalBatchSize')
    .populate('practicalBatchAssignments.classroom', 'name year practicalBatchSize')
    .populate('practicalBatchAssignments.subject', 'name code year category')
    .lean();

  // Attach assignedSubjects by querying Subject.assignedTeacher (single source of truth)
  const teacherIds = teachers.map((t) => t._id);
  const subjects = await Subject.find({ assignedTeacher: { $in: teacherIds } }).select('name code year assignedTeacher');
  const subjectsByTeacher = subjects.reduce((acc, s) => {
    const tid = s.assignedTeacher.toString();
    if (!acc[tid]) acc[tid] = [];
    acc[tid].push(s);
    return acc;
  }, {});

  const teachersWithSubjects = teachers.map((t) => ({
    ...t,
    assignedSubjects: subjectsByTeacher[t._id.toString()] || []
  }));

  res.status(200).json(teachersWithSubjects);
});

exports.getStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({}).select('-password').sort({ className: 1, division: 1, rollNo: 1 });
  res.status(200).json(students);
});

exports.getClassrooms = asyncHandler(async (req, res) => {
  const classrooms = await Classroom.find();
  res.status(200).json(classrooms);
});

exports.updateClassroom = asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  const { name, year, practicalBatchSize } = req.body;

  const classroom = await Classroom.findById(classroomId);
  if (!classroom) {
    res.status(404);
    throw new Error('Classroom not found');
  }

  if (name !== undefined) classroom.name = name;
  if (year !== undefined) classroom.year = year;
  if (practicalBatchSize !== undefined) {
    const normalizedBatchSize = parsePracticalBatchSize(practicalBatchSize);
    if (!normalizedBatchSize) {
      res.status(400);
      throw new Error('practicalBatchSize must be an integer between 1 and 100');
    }
    classroom.practicalBatchSize = normalizedBatchSize;
  }

  await classroom.save();
  emitAdminDashboardUpdate(req, 'classroom-updated', { classroomId: classroom._id, classroomName: classroom.name });
  res.status(200).json(classroom);
});

exports.getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find().populate('assignedTeacher', 'name email branch');
  res.status(200).json(subjects);
});

exports.getOverviewStats = asyncHandler(async (req, res) => {
  const scope = req.user.role === 'SuperAdmin' || !req.user.branch ? {} : { branch: req.user.branch };

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date(end);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalStudents,
    totalTeachers,
    totalClassrooms,
    totalSubjects,
    todayAttendance,
    weeklyAttendance,
    recentTeachers,
    recentStudents,
    recentAttendance
  ] = await Promise.all([
    Student.countDocuments(scope),
    Teacher.countDocuments(scope),
    Classroom.countDocuments(),
    Subject.countDocuments(),
    Attendance.find({ date: { $gte: start, $lte: end } }).select('date records classroom subject createdAt').populate('classroom', 'name year').populate('subject', 'name code').sort({ date: -1 }).lean(),
    Attendance.find({ date: { $gte: sevenDaysAgo, $lte: end } }).select('date records').sort({ date: 1 }).lean(),
    Teacher.find(scope).select('name email branch createdAt').sort({ createdAt: -1 }).limit(5).lean(),
    Student.find(scope).select('name email rollNo className division branch createdAt').sort({ createdAt: -1 }).limit(5).lean(),
    Attendance.find({ date: { $gte: sevenDaysAgo, $lte: end } }).select('date classroom subject createdAt').populate('classroom', 'name year').populate('subject', 'name code').sort({ date: -1 }).limit(5).lean()
  ]);

  let totalPresent = 0;
  let totalMarked = 0;
  todayAttendance.forEach((a) => {
    (a.records || []).forEach((r) => {
      totalMarked += 1;
      if (r.status === 'present') totalPresent += 1;
    });
  });

  const attendanceRate = totalMarked ? Math.round((totalPresent / totalMarked) * 10000) / 100 : 0;

  const todayAbsent = Math.max(0, totalMarked - totalPresent);

  const dailyMap = weeklyAttendance.reduce((acc, attendance) => {
    const key = new Date(attendance.date).toISOString().slice(0, 10);
    if (!acc[key]) acc[key] = { present: 0, total: 0 };
    (attendance.records || []).forEach((record) => {
      acc[key].total += 1;
      if (record.status === 'present') acc[key].present += 1;
    });
    return acc;
  }, {});

  const attendanceTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const dayData = dailyMap[key] || { present: 0, total: 0 };
    const percentage = dayData.total ? Math.round((dayData.present / dayData.total) * 10000) / 100 : 0;
    return {
      day: date.toLocaleDateString([], { weekday: 'short' }),
      value: percentage,
      date: key
    };
  });

  const activityItems = [
    ...recentTeachers.map((teacher) => ({
      id: `teacher-${teacher._id || teacher.email}`,
      type: 'teacher',
      text: `New teacher ${teacher.name} added`,
      timestamp: teacher.createdAt
    })),
    ...recentStudents.map((student) => ({
      id: `student-${student._id || student.email}`,
      type: 'student',
      text: `New student ${student.name} added`,
      timestamp: student.createdAt
    })),
    ...recentAttendance.map((attendance) => ({
      id: `attendance-${attendance._id}`,
      type: 'attendance',
      text: `Attendance recorded for ${attendance.classroom?.name || 'Classroom'}${attendance.subject?.name ? ` / ${attendance.subject.name}` : ''}`,
      timestamp: attendance.createdAt || attendance.date
    }))
  ]
    .filter((item) => item.timestamp)
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, 6)
    .map((item) => ({
      ...item,
      timestamp: item.timestamp
    }));

  res.status(200).json({
    totalStudents,
    totalTeachers,
    totalClassrooms,
    totalSubjects,
    todaysAttendanceMarked: totalMarked,
    todaysPresentCount: totalPresent,
    todaysAbsentCount: todayAbsent,
    todaysAttendanceRate: attendanceRate,
    attendanceTrend,
    attendanceStatus: {
      present: totalPresent,
      absent: todayAbsent,
      total: totalMarked,
      rate: attendanceRate
    },
    recentTeachers,
    recentStudents,
    recentActivities: activityItems
  });
});

exports.getReports = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit || '20', 10)));

  const scope = req.user.role === 'SuperAdmin' || !req.user.branch ? {} : { branch: req.user.branch };
  const studentFilter = { ...scope };
  const teacherFilter = { ...scope };
  const subjectFilter = { ...scope };
  const classroomFilter = {};
  const attendanceQuery = {};

  if (req.query.branch && req.user.role === 'SuperAdmin') {
    studentFilter.branch = req.query.branch;
    teacherFilter.branch = req.query.branch;
    subjectFilter.branch = req.query.branch;
  }

  if (req.query.className) studentFilter.className = req.query.className;
  if (req.query.division) studentFilter.division = String(req.query.division).toUpperCase();
  if (req.query.classroom) classroomFilter._id = req.query.classroom;
  if (req.query.teacherId) attendanceQuery.teacher = req.query.teacherId;
  if (req.query.subjectId) attendanceQuery.subject = req.query.subjectId;
  if (req.query.sessionType) attendanceQuery.sessionType = req.query.sessionType;
  if (req.query.from || req.query.to || req.query.date) {
    attendanceQuery.date = {};
    if (req.query.date) {
      const day = new Date(req.query.date);
      day.setHours(0, 0, 0, 0);
      attendanceQuery.date.$gte = day;
      const dayEnd = new Date(req.query.date);
      dayEnd.setHours(23, 59, 59, 999);
      attendanceQuery.date.$lte = dayEnd;
    } else {
      if (req.query.from) {
        const from = new Date(req.query.from);
        from.setHours(0, 0, 0, 0);
        attendanceQuery.date.$gte = from;
      }
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        attendanceQuery.date.$lte = to;
      }
    }
  }

  if (classroomFilter._id) attendanceQuery.classroom = classroomFilter._id;

  const [students, classrooms, subjects, teachers, attendanceRecords] = await Promise.all([
    Student.find(studentFilter).select('_id name rollNo className division branch classroom').populate('classroom', 'name year').sort({ className: 1, division: 1, rollNo: 1 }).lean(),
    Classroom.find(scope).select('_id name year practicalBatchSize').sort({ name: 1 }).lean(),
    Subject.find(subjectFilter).select('_id name code year category assignedTeacher').populate('assignedTeacher', 'name email branch').sort({ year: 1, name: 1 }).lean(),
    Teacher.find(teacherFilter).select('_id name email branch').sort({ name: 1 }).lean(),
    Attendance.find(attendanceQuery)
      .populate('classroom', 'name year')
      .populate('subject', 'name code year category')
      .populate('teacher', 'name email branch')
      .populate('lectureSession', 'startDateTime endDateTime status')
      .sort({ date: -1, startTime: 1, endTime: 1 })
      .lean()
  ]);

  const recordsByStudent = new Map();
  const sheets = attendanceRecords.map((attendance) => {
    const presentCount = Array.isArray(attendance.records) ? attendance.records.filter((record) => record.status === 'present').length : 0;
    const absentCount = Array.isArray(attendance.records) ? attendance.records.filter((record) => record.status === 'absent').length : 0;

    (attendance.records || []).forEach((record) => {
      if (!record.student) return;
      const studentId = record.student._id ? record.student._id.toString() : record.student.toString();
      if (!recordsByStudent.has(studentId)) recordsByStudent.set(studentId, []);
      recordsByStudent.get(studentId).push({ attendance, record });
    });

    return {
      id: attendance._id,
      date: attendance.date,
      classroom: attendance.classroom,
      subject: attendance.subject,
      teacher: attendance.teacher,
      sessionType: attendance.sessionType,
      startTime: attendance.startTime,
      endTime: attendance.endTime,
      lectureSession: attendance.lectureSession,
      totalStudents: Array.isArray(attendance.records) ? attendance.records.length : 0,
      presentCount,
      absentCount,
      practicalBatchIds: attendance.practicalBatchIds || []
    };
  });

  const flattenedRows = [];
  attendanceRecords.forEach((attendance) => {
    (attendance.records || []).forEach((record) => {
      if (!record.student) return;
      const student = record.student && typeof record.student === 'object' ? record.student : null;
      flattenedRows.push({
        attendanceId: attendance._id,
        date: attendance.date,
        classroomId: attendance.classroom?._id || attendance.classroom,
        classroomName: attendance.classroom?.name || 'Classroom',
        classroomYear: attendance.classroom?.year || '',
        subjectId: attendance.subject?._id || attendance.subject,
        subjectName: attendance.subject?.name || 'Subject',
        subjectCode: attendance.subject?.code || '',
        teacherId: attendance.teacher?._id || attendance.teacher,
        teacherName: attendance.teacher?.name || 'Teacher',
        teacherBranch: attendance.teacher?.branch || '',
        sessionType: attendance.sessionType || 'Lecture',
        startTime: attendance.startTime || attendance.lectureSession?.startDateTime || null,
        endTime: attendance.endTime || attendance.lectureSession?.endDateTime || null,
        studentId: student?._id || record.student,
        studentName: student?.name || 'Student',
        rollNo: student?.rollNo || '',
        className: student?.className || student?.classroom?.name || '',
        division: student?.division || '',
        status: record.status,
        leaveId: record.leaveId || null,
        attendanceSource: record.attendanceSource || 'manual'
      });
    });
  });

  const summaryByStudent = students.reduce((acc, student) => {
    acc[student._id.toString()] = { present: 0, total: 0, subjects: {} };
    return acc;
  }, {});

  flattenedRows.forEach((row) => {
    const studentId = row.studentId?.toString();
    const subjectId = row.subjectId?.toString();
    if (studentId) {
      if (!summaryByStudent[studentId]) {
        summaryByStudent[studentId] = { present: 0, total: 0, subjects: {} };
      }
      summaryByStudent[studentId].total += 1;
      if (row.status === 'present') summaryByStudent[studentId].present += 1;

      if (subjectId) {
        if (!summaryByStudent[studentId].subjects[subjectId]) {
          summaryByStudent[studentId].subjects[subjectId] = { present: 0, total: 0 };
        }
        summaryByStudent[studentId].subjects[subjectId].total += 1;
        if (row.status === 'present') summaryByStudent[studentId].subjects[subjectId].present += 1;
      }
    }
  });

  const summaryRows = students.map((student) => {
    const sum = summaryByStudent[student._id.toString()] || { present: 0, total: 0, subjects: {} };
    const absent = Math.max(0, sum.total - sum.present);
    const percentage = sum.total ? Math.round((sum.present / sum.total) * 10000) / 100 : 0;

    const subjectAttendance = {};
    Object.entries(sum.subjects || {}).forEach(([subId, subSum]) => {
      subjectAttendance[subId] = subSum.total
        ? Math.round((subSum.present / subSum.total) * 10000) / 100
        : 0;
    });

    return {
      studentId: student._id,
      studentName: student.name,
      rollNo: student.rollNo,
      className: student.className,
      division: student.division,
      branch: student.branch,
      presentDays: sum.present,
      absentDays: absent,
      attendancePercentage: percentage,
      subjectAttendance
    };
  });

  const total = flattenedRows.length;
  const startIndex = (page - 1) * limit;
  const paged = flattenedRows.slice(startIndex, startIndex + limit);

  const filterOptions = {
    branches: [...new Set(students.map((student) => student.branch).filter(Boolean))].sort(),
    classes: classrooms.map((classroom) => ({ _id: classroom._id, name: classroom.name, year: classroom.year })),
    subjects: subjects.map((subject) => ({ _id: subject._id, name: subject.name, code: subject.code, year: subject.year, category: subject.category })),
    teachers: teachers.map((teacher) => ({ _id: teacher._id, name: teacher.name, branch: teacher.branch })),
    sessionTypes: ['Lecture', 'Practical']
  };

  res.status(200).json({
    rows: paged,
    summaryRows,
    sheets,
    filterOptions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  });
});

exports.updateTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const {
    name,
    email,
    branch,
    assignedClassrooms,
    yearClasses,
    subjects,
    mustChangePassword,
    practicalAssignments
  } = req.body;

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  if (name !== undefined) teacher.name = name;
  if (email !== undefined) teacher.email = email;
  if (branch !== undefined) teacher.branch = branch;
  if (mustChangePassword !== undefined) teacher.mustChangePassword = !!mustChangePassword;

  const classroomIds = assignedClassrooms || (Array.isArray(yearClasses) ? yearClasses.map((yc) => yc?.class).filter(Boolean) : null);
  if (classroomIds) {
    const resolved = [];
    for (const item of classroomIds) {
      if (typeof item === 'string' && item.match(/^[0-9a-fA-F]{24}$/)) {
        resolved.push(item);
      } else if (item && typeof item === 'object' && item._id) {
        resolved.push(item._id.toString());
      } else if (typeof item === 'string') {
        let found = await Classroom.findOne({ name: item });
        if (!found) found = await Classroom.create({ name: item, practicalBatchSize: 20, createdBy: req.user._id });
        resolved.push(found._id.toString());
      }
    }
    teacher.assignedClassrooms = [...new Set(resolved)];
  }

  let selectedSubjects = null;
  if (Array.isArray(subjects)) {
    const subjectIds = [];
    for (const subj of subjects) {
      if (typeof subj === 'string' && subj.match(/^[0-9a-fA-F]{24}$/)) {
        subjectIds.push(subj);
      } else if (subj && typeof subj === 'object' && subj._id) {
        subjectIds.push(subj._id.toString());
      } else if (typeof subj === 'string' && subj.trim()) {
        const cleanedName = subj.replace(/\s*\((Theory|Practical)\)\s*$/i, '').trim();
        let found = await Subject.findOne({ name: cleanedName });
        if (!found) found = await Subject.create({ name: cleanedName, createdBy: req.user._id });
        subjectIds.push(found._id.toString());
      }
    }
    // Replace teacher-subject mapping entirely, including explicit clear when no subjects are selected.
    await Subject.updateMany({ assignedTeacher: teacher._id }, { $set: { assignedTeacher: null } });
    if (subjectIds.length > 0) {
      await Subject.updateMany({ _id: { $in: subjectIds } }, { $set: { assignedTeacher: teacher._id } });
    }
    selectedSubjects = subjectIds.length ? await Subject.find({ _id: { $in: subjectIds } }).select('_id category').lean() : [];
  }

  if (Array.isArray(practicalAssignments)) {
    const classroomDocs = Array.isArray(teacher.assignedClassrooms) && teacher.assignedClassrooms.length
      ? await Classroom.find({ _id: { $in: teacher.assignedClassrooms } }).select('_id name year practicalBatchSize').lean()
      : [];
    const practicalSubjectDocs = selectedSubjects || await Subject.find({ assignedTeacher: teacher._id }).select('_id category').lean();
    teacher.practicalBatchAssignments = await resolvePracticalBatchAssignments({
      practicalAssignments,
      subjectDocs: practicalSubjectDocs,
      classroomDocs
    });
  }

  await teacher.save();
  const updated = await Teacher.findById(teacher._id).select('-password').populate('assignedClassrooms', 'name year').lean();
  const teacherSubjects = await Subject.find({ assignedTeacher: teacher._id }).select('name code year assignedTeacher');
  emitAdminDashboardUpdate(req, 'teacher-updated', { teacherId: teacher._id, teacherName: teacher.name });
  res.status(200).json({
    ...updated,
    assignedSubjects: teacherSubjects
  });
});

exports.deleteTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    res.status(404);
    throw new Error('Teacher not found');
  }

  await Subject.updateMany({ assignedTeacher: teacher._id }, { $set: { assignedTeacher: null } });
  await Teacher.deleteOne({ _id: teacher._id });
  emitAdminDashboardUpdate(req, 'teacher-deleted', { teacherId: teacher._id, teacherName: teacher.name });
  res.status(200).json({ message: 'Teacher deleted successfully' });
});

exports.updateStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const {
    name,
    email,
    prn,
    collegePrn,
    batuPrn,
    rollNo,
    className,
    classSemester,
    division,
    branch,
    classroom,
    phone,
    studentMobile,
    parentMobile,
    parentEmail,
    mustChangePassword
  } = req.body;

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (name !== undefined) student.name = name;
  if (email !== undefined) student.email = email;
  if (prn !== undefined) student.prn = prn;
  if (collegePrn !== undefined) student.collegePrn = collegePrn;
  if (batuPrn !== undefined) student.batuPrn = batuPrn;
  if (rollNo !== undefined) student.rollNo = rollNo;
  if (className !== undefined || classSemester !== undefined) student.className = className || classSemester;
  if (division !== undefined) student.division = division;
  if (branch !== undefined) student.branch = branch;
  if (classroom !== undefined) student.classroom = classroom || undefined;
  if (phone !== undefined) student.phone = phone;
  if (studentMobile !== undefined) student.studentMobile = studentMobile;
  if (parentMobile !== undefined) student.parentMobile = parentMobile;
  if (parentEmail !== undefined) student.parentEmail = parentEmail;
  if (mustChangePassword !== undefined) student.mustChangePassword = !!mustChangePassword;

  await student.save();
  const updated = await Student.findById(student._id).select('-password').populate('classroom', 'name year').lean();
  emitAdminDashboardUpdate(req, 'student-updated', { studentId: student._id, studentName: student.name });
  res.status(200).json(updated);
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  await Student.deleteOne({ _id: student._id });
  emitAdminDashboardUpdate(req, 'student-deleted', { studentId: student._id, studentName: student.name });
  res.status(200).json({ message: 'Student deleted successfully' });
});
