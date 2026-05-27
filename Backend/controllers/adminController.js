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

const generateAutoPrn = () => `PRN${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

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
    yearClasses = []
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
      const query = { name: subj.name };
      const normalizedYear = normalizeYearToNumber(subj.year);
      if (normalizedYear) query.year = normalizedYear;
      if (subj.category) query.category = subj.category;
      let found = await Subject.findOne(query);
      if (!found) {
        found = await Subject.create({ name: subj.name, year: normalizedYear, category: subj.category || 'lecture', createdBy: req.user._id });
      }
      subjectIds.push(found._id);
    } else if (typeof subj === 'string' && subj.trim()) {
      // Frontend sends values like "ML (Theory)"; store by name for compatibility
      const isPractical = /\(Practical\)\s*$/i.test(subj);
      const cleanedName = subj.replace(/\s*\((Theory|Practical)\)\s*$/i, '').trim();
      let found = await Subject.findOne({ name: cleanedName });
      if (!found) {
        found = await Subject.create({ name: cleanedName, category: isPractical ? 'practical' : 'lecture', createdBy: req.user._id });
      }
      subjectIds.push(found._id);
    }
  }

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
        createdBy: req.user._id
      });
    }
    classroomIds.push(foundClassroom._id);
  }

  const uniqueClassroomIds = [...new Set(classroomIds.map((id) => id.toString()))];

  // Validate classrooms exist (same as before)
  if (uniqueClassroomIds.length > 0) {
    const foundClassrooms = await Classroom.find({ _id: { $in: uniqueClassroomIds } });
    if (foundClassrooms.length !== uniqueClassroomIds.length) {
      res.status(400);
      throw new Error('One or more classrooms not found');
    }
  }

  const teacher = await Teacher.create({
    name,
    email,
    password: teacherPassword,
    mustChangePassword: true,
    branch: req.user.branch, // inherit admin's branch
    assignedClassrooms: uniqueClassroomIds,
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
  res.status(201).json(student);
});

exports.getTeachers = asyncHandler(async (req, res) => {
  // SuperAdmin sees all teachers. Admins should only see teachers they created.
  // This prevents admins from viewing other admins' teachers across branches.
  const filter = req.user.role === 'SuperAdmin' ? {} : { createdBy: req.user._id };
  const teachers = await Teacher.find(filter).select('-password').populate('assignedClassrooms', 'name year').lean();

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
  // SuperAdmin sees all students, Admin sees only their branch students
  const filter = req.user.role === 'SuperAdmin' ? {} : { branch: req.user.branch };
  const students = await Student.find(filter).select('-password').sort({ className: 1, division: 1, rollNo: 1 });
  res.status(200).json(students);
});

exports.getClassrooms = asyncHandler(async (req, res) => {
  const classrooms = await Classroom.find();
  res.status(200).json(classrooms);
});

exports.getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find().populate('assignedTeacher', 'name email branch');
  res.status(200).json(subjects);
});

exports.getOverviewStats = asyncHandler(async (req, res) => {
  const scope = req.user.role === 'SuperAdmin' ? {} : { branch: req.user.branch };

  const [totalStudents, totalTeachers] = await Promise.all([
    Student.countDocuments(scope),
    Teacher.countDocuments(scope)
  ]);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const todayAttendance = await Attendance.find({ date: { $gte: start, $lte: end } }).select('records');
  let totalPresent = 0;
  let totalMarked = 0;
  todayAttendance.forEach((a) => {
    a.records.forEach((r) => {
      totalMarked += 1;
      if (r.status === 'present') totalPresent += 1;
    });
  });

  const attendanceRate = totalMarked ? Math.round((totalPresent / totalMarked) * 10000) / 100 : 0;

  res.status(200).json({
    totalStudents,
    totalTeachers,
    todaysAttendanceMarked: totalMarked,
    todaysPresentCount: totalPresent,
    todaysAttendanceRate: attendanceRate
  });
});

exports.getReports = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit || '20', 10)));

  const studentFilter = req.user.role === 'SuperAdmin' ? {} : { branch: req.user.branch };
  if (req.query.className) studentFilter.className = req.query.className;
  if (req.query.branch && req.user.role === 'SuperAdmin') studentFilter.branch = req.query.branch;

  const students = await Student.find(studentFilter)
    .select('_id name rollNo className division branch')
    .sort({ className: 1, division: 1, rollNo: 1 })
    .lean();

  const attendanceQuery = {};
  if (req.query.from || req.query.to) {
    attendanceQuery.date = {};
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

  const attendanceRecords = await Attendance.find(attendanceQuery).select('records');
  const summaryByStudent = {};

  attendanceRecords.forEach((attendance) => {
    attendance.records.forEach((record) => {
      const sid = record.student.toString();
      if (!summaryByStudent[sid]) summaryByStudent[sid] = { present: 0, total: 0 };
      summaryByStudent[sid].total += 1;
      if (record.status === 'present') summaryByStudent[sid].present += 1;
    });
  });

  const rows = students.map((s) => {
    const sum = summaryByStudent[s._id.toString()] || { present: 0, total: 0 };
    const absent = Math.max(0, sum.total - sum.present);
    const percentage = sum.total ? Math.round((sum.present / sum.total) * 10000) / 100 : 0;
    return {
      studentId: s._id,
      studentName: s.name,
      rollNo: s.rollNo,
      className: s.className,
      division: s.division,
      branch: s.branch,
      presentDays: sum.present,
      absentDays: absent,
      attendancePercentage: percentage
    };
  });

  const total = rows.length;
  const startIndex = (page - 1) * limit;
  const paged = rows.slice(startIndex, startIndex + limit);

  res.status(200).json({
    data: paged,
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
    mustChangePassword
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
        if (!found) found = await Classroom.create({ name: item, createdBy: req.user._id });
        resolved.push(found._id.toString());
      }
    }
    teacher.assignedClassrooms = [...new Set(resolved)];
  }

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
  }

  await teacher.save();
  const updated = await Teacher.findById(teacher._id).select('-password').populate('assignedClassrooms', 'name year').lean();
  const teacherSubjects = await Subject.find({ assignedTeacher: teacher._id }).select('name code year assignedTeacher');
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
  res.status(200).json({ message: 'Student deleted successfully' });
});
