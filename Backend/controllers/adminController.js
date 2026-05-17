const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');

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
  const { name, email, password, subjects = [], classrooms = [] } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Process subjects: items may be existing subject IDs (string) or objects { name, year }
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
      if (subj.year) query.year = subj.year;
      let found = await Subject.findOne(query);
      if (!found) {
        found = await Subject.create({ name: subj.name, year: subj.year, createdBy: req.user._id });
      }
      subjectIds.push(found._id);
    }
  }

  // Validate classrooms exist (same as before)
  if (classrooms.length > 0) {
    const foundClassrooms = await Classroom.find({ _id: { $in: classrooms } });
    if (foundClassrooms.length !== classrooms.length) {
      res.status(400);
      throw new Error('One or more classrooms not found');
    }
  }

  const teacher = await Teacher.create({
    name,
    email,
    password,
    branch: req.user.branch, // inherit admin's branch
    assignedClassrooms: classrooms,
    createdBy: req.user._id
  });

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
  const { prn, rollNo, name, email, password, className, division, classroom } = req.body;
  if (!prn || !rollNo || !className || !division) {
    res.status(400);
    throw new Error('PRN, rollNo, className, and division are required');
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }
  const prnExists = await Student.findOne({ prn });
  if (prnExists) {
    res.status(400);
    throw new Error('Student with this PRN already exists');
  }
  const room = classroom ? await Classroom.findById(classroom) : null;
  const student = await Student.create({
    prn,
    rollNo,
    name,
    email,
    password,
    className,
    division,
    branch: req.user.branch, // inherit admin's branch
    classroom: room ? room._id : undefined,
    createdBy: req.user._id
  });
  res.status(201).json(student);
});

exports.getTeachers = asyncHandler(async (req, res) => {
  // SuperAdmin sees all teachers, Admin sees only their branch teachers
  const filter = req.user.role === 'SuperAdmin' ? {} : { branch: req.user.branch };
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
