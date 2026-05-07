const asyncHandler = require('express-async-handler');
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
  const admin = await User.create({
    name,
    email,
    password,
    role: 'Admin',
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

  const teacher = await User.create({
    name,
    email,
    password,
    role: 'Teacher',
    branch: req.user.branch, // inherit admin's branch
    assignedSubjects: subjectIds,
    assignedClassrooms: classrooms,
    createdBy: req.user._id
  });
  res.status(201).json(teacher);
});

exports.createStudent = asyncHandler(async (req, res) => {
  const { name, email, password, classroom } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }
  const room = classroom ? await Classroom.findById(classroom) : null;
  const student = await User.create({
    name,
    email,
    password,
    role: 'Student',
    branch: req.user.branch, // inherit admin's branch
    classroom: room ? room._id : undefined,
    createdBy: req.user._id
  });
  res.status(201).json(student);
});

exports.getTeachers = asyncHandler(async (req, res) => {
  // SuperAdmin sees all teachers, Admin sees only their branch teachers
  const filter = req.user.role === 'SuperAdmin' ? {} : { branch: req.user.branch };
  const teachers = await User.find({ role: 'Teacher', ...filter }).select('-password');
  res.status(200).json(teachers);
});

exports.getStudents = asyncHandler(async (req, res) => {
  // SuperAdmin sees all students, Admin sees only their branch students
  const filter = req.user.role === 'SuperAdmin' ? {} : { branch: req.user.branch };
  const students = await User.find({ role: 'Student', ...filter }).select('-password');
  res.status(200).json(students);
});

exports.getClassrooms = asyncHandler(async (req, res) => {
  const classrooms = await Classroom.find();
  res.status(200).json(classrooms);
});

exports.getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find();
  res.status(200).json(subjects);
});
