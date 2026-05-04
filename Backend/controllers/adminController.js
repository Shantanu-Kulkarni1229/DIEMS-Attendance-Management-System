const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Classroom = require('../models/Classroom');

exports.createTeacher = asyncHandler(async (req, res) => {
  const { name, email, password, assignedSubjects = [], assignedClassrooms = [] } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }
  const teacher = await User.create({
    name,
    email,
    password,
    role: 'Teacher',
    assignedSubjects,
    assignedClassrooms,
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
    classroom: room ? room._id : undefined,
    createdBy: req.user._id
  });
  res.status(201).json(student);
});
