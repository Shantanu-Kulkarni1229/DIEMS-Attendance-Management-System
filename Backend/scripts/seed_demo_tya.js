require('dotenv').config();
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');

async function upsertClassroom(name, year, createdBy) {
  const existing = await Classroom.findOne({ name });
  if (existing) return existing;
  return Classroom.create({ name, year, createdBy });
}

async function upsertSubjectByName(name, opts = {}) {
  let sub = await Subject.findOne({ name });
  if (!sub) {
    sub = await Subject.create({ name, code: opts.code || '', year: opts.year || undefined, category: opts.category || 'lecture', createdBy: opts.createdBy });
  }
  return sub;
}

async function upsertStudent(payload) {
  const lookup = { email: payload.email };
  let existing = await Student.findOne(lookup);
  if (existing) {
    // update a few fields in case seed changed
    existing.name = payload.name;
    existing.rollNo = payload.rollNo;
    existing.prn = payload.prn;
    existing.className = payload.className;
    existing.division = payload.division;
    existing.classroom = payload.classroom;
    await existing.save();
    return existing;
  }
  const created = await Student.create(payload);
  return created;
}

async function main() {
  try {
    const mongoUri = process.argv[2] || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('Please provide MONGO_URI as first arg or set MONGO_URI in .env');
      process.exit(1);
    }
    await connectDB(mongoUri);

    // find admin and teacher (fallback to any)
    const admin = (await Admin.findOne({ email: 'ui.admin@diems.test' })) || (await Admin.findOne()) || null;
    let teacher = (await Teacher.findOne({ email: 'ui.teacher@diems.test' })) || (await Teacher.findOne()) || null;

    if (!teacher) {
      console.warn('No teacher found in DB. Creating a demo teacher.');
      const t = await Teacher.create({ name: 'Demo Teacher', email: `demo.teacher.${Date.now()}@diems.test`, password: 'diems@123', branch: 'CSE' });
      teacher = t;
    }

    const classroomName = 'TYA';
    const classroomYear = 'TY';
    const classroom = await upsertClassroom(classroomName, classroomYear, admin ? admin._id : undefined);

    const subjectName = 'Competitive Programming';
    const subject = await upsertSubjectByName(subjectName, { code: 'CP601', year: 4, category: 'lecture', createdBy: admin ? admin._id : undefined });

    // assign subject to teacher
    subject.assignedTeacher = teacher._id;
    await subject.save();

    // ensure teacher has this classroom in assignedClassrooms
    const assigned = Array.isArray(teacher.assignedClassrooms) ? teacher.assignedClassrooms.map(String) : [];
    if (!assigned.includes(String(classroom._id))) {
      teacher.assignedClassrooms = [...(teacher.assignedClassrooms || []), classroom._id];
      await teacher.save();
    }

    // create 20 students cs3101..cs3130
    const students = [];
    for (let n = 101; n <= 130; n++) {
      const roll = `cs3${String(n)}`; // cs3101 etc
      const email = `${roll}@diems.demo`;
      const studentPayload = {
        name: `Demo ${roll}`,
        email,
        password: 'diems@123',
        prn: `PRN${Date.now()}${Math.floor(Math.random() * 900 + 100)}`,
        rollNo: roll,
        className: 'TY',
        division: 'A',
        branch: 'CSE',
        classroom: classroom._id,
        createdBy: admin ? admin._id : undefined
      };
      // upsert student
      // eslint-disable-next-line no-await-in-loop
      const s = await upsertStudent(studentPayload);
      students.push(s);
    }

    console.log('Demo seed complete:');
    console.log('Classroom:', { id: classroom._id.toString(), name: classroom.name });
    console.log('Subject:', { id: subject._id.toString(), name: subject.name, assignedTeacher: subject.assignedTeacher ? subject.assignedTeacher.toString() : null });
    console.log('Teacher:', { id: teacher._id.toString(), name: teacher.name, email: teacher.email });
    console.log('Students created/updated:', students.length);
    console.log(students.map((s) => ({ id: s._id.toString(), name: s.name, email: s.email, rollNo: s.rollNo })));

    process.exit(0);
  } catch (err) {
    console.error('Demo seed failed:', err);
    process.exit(1);
  }
}

main();
