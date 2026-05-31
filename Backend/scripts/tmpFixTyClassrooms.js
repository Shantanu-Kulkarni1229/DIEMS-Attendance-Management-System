require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const Teacher = require('../models/Teacher');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let tyA = await Classroom.findOne({ name: 'TY-A' });
  if (!tyA) tyA = await Classroom.create({ name: 'TY-A', year: 'TY' });

  let tyB = await Classroom.findOne({ name: 'TY-B' });
  if (!tyB) tyB = await Classroom.create({ name: 'TY-B', year: 'TY' });

  const tyaRes = await Student.updateMany(
    { className: /^TY$/i, division: /^A$/i },
    { $set: { classroom: tyA._id } }
  );

  const tybRes = await Student.updateMany(
    { className: /^TY$/i, division: /^B$/i },
    { $set: { classroom: tyB._id } }
  );

  const teacher = await Teacher.findOne({ email: 'ui.teacher@diems.test' });
  if (teacher) {
    teacher.assignedClassrooms = [tyA._id, tyB._id];
    await teacher.save();
  }

  const summary = {
    tyAClassroomId: String(tyA._id),
    tyBClassroomId: String(tyB._id),
    tyAStudents: await Student.countDocuments({ classroom: tyA._id }),
    tyBStudents: await Student.countDocuments({ classroom: tyB._id }),
    teacherAssignedClassrooms: teacher ? teacher.assignedClassrooms.map(String) : [],
    updateMatched: {
      tya: tyaRes.matchedCount,
      tyb: tybRes.matchedCount,
    },
    updateModified: {
      tya: tyaRes.modifiedCount,
      tyb: tybRes.modifiedCount,
    }
  };

  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
