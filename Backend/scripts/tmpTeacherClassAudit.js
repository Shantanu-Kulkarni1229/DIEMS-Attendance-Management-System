require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const Teacher = require('../models/Teacher');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const classrooms = await Classroom.find({}).select('_id name year').lean();
  const counts = await Student.aggregate([
    { $group: { _id: '$classroom', count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map(c => [String(c._id), c.count]));

  const teacher = await Teacher.findOne({ email: 'ui.teacher@diems.test' })
    .select('name email assignedClassrooms')
    .lean();

  const teacherClassrooms = (teacher?.assignedClassrooms || []).map(id => {
    const c = classrooms.find(x => String(x._id) === String(id));
    return {
      classroomId: String(id),
      name: c?.name || 'UNKNOWN',
      year: c?.year || '',
      studentCount: countMap.get(String(id)) || 0,
    };
  });

  const allClassrooms = classrooms.map(c => ({
    classroomId: String(c._id),
    name: c.name,
    year: c.year || '',
    studentCount: countMap.get(String(c._id)) || 0,
  })).sort((a,b) => a.name.localeCompare(b.name));

  console.log(JSON.stringify({
    teacher: teacher ? { name: teacher.name, email: teacher.email } : null,
    teacherClassrooms,
    allClassrooms,
  }, null, 2));

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
