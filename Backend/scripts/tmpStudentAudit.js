require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Classroom = require('../models/Classroom');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const byClassDiv = await Student.aggregate([
    { $group: { _id: { className: '$className', division: '$division' }, count: { $sum: 1 } } },
    { $sort: { '_id.className': 1, '_id.division': 1 } }
  ]);

  const byClassroom = await Student.aggregate([
    { $match: { classroom: { $ne: null } } },
    { $group: { _id: '$classroom', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const classrooms = await Classroom.find({}).select('_id name year').lean();
  const map = new Map(classrooms.map(c => [String(c._id), c]));

  const byClassroomNamed = byClassroom.map(r => ({
    classroomId: String(r._id),
    classroomName: map.get(String(r._id))?.name || 'UNKNOWN',
    year: map.get(String(r._id))?.year || '',
    count: r.count,
  }));

  const tybSample = await Student.find({ className: /^TY$/i, division: /^B$/i })
    .select('name rollNo prn className division classroom')
    .sort({ rollNo: 1 })
    .limit(10)
    .lean();

  const tyaSample = await Student.find({ className: /^TY$/i, division: /^A$/i })
    .select('name rollNo prn className division classroom')
    .sort({ rollNo: 1 })
    .limit(10)
    .lean();

  console.log(JSON.stringify({
    totalStudents: await Student.countDocuments(),
    byClassDiv,
    byClassroomNamed,
    tybCount: await Student.countDocuments({ className: /^TY$/i, division: /^B$/i }),
    tyaCount: await Student.countDocuments({ className: /^TY$/i, division: /^A$/i }),
    tybSample,
    tyaSample,
  }, null, 2));

  await mongoose.disconnect();
})().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
