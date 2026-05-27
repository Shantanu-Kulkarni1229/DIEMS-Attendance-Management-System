require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const SuperAdmin = require('../models/SuperAdmin');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const TimetableEntry = require('../models/TimetableEntry');
const LectureSession = require('../models/LectureSession');

const seedUsers = {
  superAdmin: {
    name: 'UI Super Admin',
    email: 'ui.superadmin@diems.test',
    password: 'UiTest@123',
    role: 'SuperAdmin'
  },
  admin: {
    name: 'UI Admin',
    email: 'ui.admin@diems.test',
    password: 'UiTest@123',
    role: 'Admin'
  },
  teacher: {
    name: 'UI Teacher',
    email: 'ui.teacher@diems.test',
    password: 'UiTest@123',
    role: 'Teacher'
  },
  student: {
    name: 'UI Student',
    email: 'ui.student@diems.test',
    password: 'UiTest@123',
    role: 'Student'
  }
};

const classroomSeeds = [
  { name: 'FY-A', year: 'FY' },
  { name: 'SY-A', year: 'SY' },
  { name: 'TY-A', year: 'TY' },
  { name: 'BTECH-A', year: 'BTECH' }
];

const subjectSeeds = [
  { name: 'ML', code: 'ML101', year: 3 },
  { name: 'CN', code: 'CN201', year: 3 },
  { name: 'CD', code: 'CD301', year: 2 },
  { name: 'CP', code: 'CP401', year: 4 }
];

const studentPlan = {
  FY: { className: 'FY', division: 'A', branch: 'BSH' },
  SY: { className: 'SY', division: 'A', branch: 'CSE' },
  TY: { className: 'TY', division: 'A', branch: 'CSE' },
  BTECH: { className: 'BTECH', division: 'A', branch: 'CSE' }
};

async function upsertUser(Model, payload) {
  const existing = await Model.findOne({ email: payload.email });
  if (existing) {
    existing.name = payload.name;
    existing.password = payload.password;
    existing.mustChangePassword = false;
    if (payload.branch !== undefined) existing.branch = payload.branch;
    if (payload.extra) Object.assign(existing, payload.extra);
    await existing.save();
    return existing;
  }

  const data = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    mustChangePassword: false,
    ...(payload.branch ? { branch: payload.branch } : {}),
    ...(payload.extra || {})
  };

  return Model.create(data);
}

async function upsertClassroom(seed, createdBy) {
  const existing = await Classroom.findOne({ name: seed.name });
  if (existing) {
    existing.year = seed.year;
    if (createdBy) existing.createdBy = createdBy;
    await existing.save();
    return existing;
  }

  return Classroom.create({
    name: seed.name,
    year: seed.year,
    createdBy
  });
}

async function upsertSubject(seed, createdBy) {
  const existing = await Subject.findOne({ name: seed.name });
  if (existing) {
    existing.code = seed.code;
    existing.year = seed.year;
    if (createdBy) existing.createdBy = createdBy;
    await existing.save();
    return existing;
  }

  return Subject.create({
    name: seed.name,
    code: seed.code,
    year: seed.year,
    createdBy
  });
}

async function upsertDummyStudentsForClassroom(classroom, index, createdBy, count = 20) {
  const classKey = String(classroom.year || classroom.name || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const plan = studentPlan[classKey] || { className: classKey || classroom.name, division: 'A', branch: 'CSE' };
  const prefix = classroom.name.replace(/[^A-Z0-9]/gi, '').toUpperCase() || `CLASS${index + 1}`;
  const created = [];

  for (let rollIndex = 1; rollIndex <= count; rollIndex += 1) {
    const rollNo = String(rollIndex).padStart(2, '0');
    const email = `ui.${prefix.toLowerCase()}.student${rollNo.toLowerCase()}@diems.test`;
    const prn = `UI${String(classroom.year || '00').toUpperCase().replace(/[^A-Z0-9]/g, '')}${String(index + 1).padStart(2, '0')}${rollNo}`;
    const name = `${classroom.name} Student ${rollNo}`;

    const existing = await Student.findOne({ email });
    if (existing) {
      existing.name = name;
      existing.password = 'UiTest@123';
      existing.mustChangePassword = false;
      existing.prn = prn;
      existing.rollNo = rollNo;
      existing.className = plan.className;
      existing.division = plan.division;
      existing.branch = plan.branch;
      existing.classroom = classroom._id;
      existing.phone = `99999${String(index + 1).padStart(2, '0')}${rollNo}`;
      existing.parentEmail = `parent.${prefix.toLowerCase()}.${rollNo}@diems.test`;
      if (createdBy) existing.createdBy = createdBy;
      await existing.save();
      created.push(existing);
      continue;
    }

    const duplicatePrn = await Student.findOne({ prn });
    if (duplicatePrn) {
      duplicatePrn.name = name;
      duplicatePrn.email = email;
      duplicatePrn.password = 'UiTest@123';
      duplicatePrn.mustChangePassword = false;
      duplicatePrn.rollNo = rollNo;
      duplicatePrn.className = plan.className;
      duplicatePrn.division = plan.division;
      duplicatePrn.branch = plan.branch;
      duplicatePrn.classroom = classroom._id;
      duplicatePrn.phone = `99999${String(index + 1).padStart(2, '0')}${rollNo}`;
      duplicatePrn.parentEmail = `parent.${prefix.toLowerCase()}.${rollNo}@diems.test`;
      if (createdBy) duplicatePrn.createdBy = createdBy;
      await duplicatePrn.save();
      created.push(duplicatePrn);
      continue;
    }

    const student = await Student.create({
      name,
      email,
      password: 'UiTest@123',
      mustChangePassword: false,
      prn,
      rollNo,
      className: plan.className,
      division: plan.division,
      branch: plan.branch,
      classroom: classroom._id,
      phone: `99999${String(index + 1).padStart(2, '0')}${rollNo}`,
      parentEmail: `parent.${prefix.toLowerCase()}.${rollNo}@diems.test`,
      createdBy
    });
    created.push(student);
  }

  return created;
}

const buildSessionTimes = (date, startTime, endTime) => {
  const start = new Date(date);
  const end = new Date(date);
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  start.setHours(sh, sm, 0, 0);
  end.setHours(eh, em, 0, 0);
  return { start, end };
};

async function upsertLectureSession(timetableEntryId, date, payload) {
  const query = { timetableEntry: timetableEntryId, date };
  // Try to find an exact match first
  let doc = await LectureSession.findOne(query);
  if (doc) {
    Object.assign(doc, payload);
    await doc.save();
    return doc;
  }

  // If no exact match, ensure we don't violate unique indexes (classroom + startDateTime)
  const clash = await LectureSession.findOne({ classroom: payload.classroom, startDateTime: payload.startDateTime });
  if (clash) {
    Object.assign(clash, payload);
    await clash.save();
    return clash;
  }

  try {
    return await LectureSession.create({ timetableEntry: timetableEntryId, date, ...payload });
  } catch (err) {
    // Handle potential race condition duplicate-key
    if (err && err.code === 11000) {
      const existing = await LectureSession.findOne({ classroom: payload.classroom, startDateTime: payload.startDateTime });
      if (existing) {
        Object.assign(existing, payload);
        await existing.save();
        return existing;
      }
    }
    throw err;
  }
}

async function seed() {
  try {
    const mongoUri = process.argv[2] || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('Missing MongoDB URI. Set MONGO_URI in .env or pass it as the first CLI argument.');
      process.exit(1);
    }

    await connectDB(mongoUri);

    const superAdmin = await upsertUser(SuperAdmin, seedUsers.superAdmin);
    const admin = await upsertUser(Admin, seedUsers.admin);
    const classrooms = [];
    for (const classroomSeed of classroomSeeds) {
      classrooms.push(await upsertClassroom(classroomSeed, admin._id));
    }

    const subjects = [];
    for (const subjectSeed of subjectSeeds) {
      subjects.push(await upsertSubject(subjectSeed, admin._id));
    }

    const teacher = await upsertUser(Teacher, {
      ...seedUsers.teacher,
      extra: {
        assignedClassrooms: classrooms.slice(0, 2).map((classroom) => classroom._id),
        createdBy: admin._id
      }
    });

    await Subject.updateMany({ _id: { $in: subjects.map((subject) => subject._id) } }, { $set: { assignedTeacher: teacher._id } });

    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    const ttMl = await TimetableEntry.findOneAndUpdate(
      {
        classroom: classrooms[1]._id,
        subject: subjects[0]._id,
        plannedTeacher: teacher._id,
        dayOfWeek: dayStart.getDay(),
        startTime: '10:15',
        endTime: '11:15'
      },
      {
        $set: {
          validFrom: dayStart,
          validTo: dayEnd,
          isActive: true,
          createdBy: admin._id
        }
      },
      { upsert: true, new: true }
    );

    const ttCn = await TimetableEntry.findOneAndUpdate(
      {
        classroom: classrooms[1]._id,
        subject: subjects[1]._id,
        plannedTeacher: teacher._id,
        dayOfWeek: dayStart.getDay(),
        startTime: '11:15',
        endTime: '12:15'
      },
      {
        $set: {
          validFrom: dayStart,
          validTo: dayEnd,
          isActive: true,
          createdBy: admin._id
        }
      },
      { upsert: true, new: true }
    );

    const mlTimes = buildSessionTimes(dayStart, ttMl.startTime, ttMl.endTime);
    const cnTimes = buildSessionTimes(dayStart, ttCn.startTime, ttCn.endTime);

    await upsertLectureSession(ttMl._id, dayStart, {
      startDateTime: mlTimes.start,
      endDateTime: mlTimes.end,
      classroom: ttMl.classroom,
      subject: ttMl.subject,
      plannedTeacher: ttMl.plannedTeacher,
      status: 'planned',
      createdBy: admin._id
    });

    await upsertLectureSession(ttCn._id, dayStart, {
      startDateTime: cnTimes.start,
      endDateTime: cnTimes.end,
      classroom: ttCn.classroom,
      subject: ttCn.subject,
      plannedTeacher: ttCn.plannedTeacher,
      status: 'planned',
      createdBy: admin._id
    });

    const student = await upsertUser(Student, {
      ...seedUsers.student,
      extra: {
        prn: 'UI2026001',
        rollNo: '01',
        className: 'SY',
        division: 'A',
        branch: 'CSE',
        classroom: classrooms[1]._id,
        phone: '9999999999',
        parentEmail: 'ui.parent@diems.test'
      }
    });

    const dummyStudentsByClassroom = [];
    for (let classroomIndex = 0; classroomIndex < classrooms.length; classroomIndex += 1) {
      const classroom = classrooms[classroomIndex];
      const seededStudents = await upsertDummyStudentsForClassroom(classroom, classroomIndex, admin._id, 20);
      dummyStudentsByClassroom.push({ classroom: classroom.name, students: seededStudents.length });
    }

    console.log('Seed complete. Created/updated:');
    console.log(`- SuperAdmin: ${superAdmin.email}`);
    console.log(`- Admin: ${admin.email}`);
    console.log(`- Teacher: ${teacher.email}`);
    console.log(`- Student: ${student.email}`);
    console.log(`- Classrooms: ${classrooms.map((classroom) => classroom.name).join(', ')}`);
    console.log(`- Subjects: ${subjects.map((subject) => subject.name).join(', ')}`);
    console.log(`- Dummy students per class: ${dummyStudentsByClassroom.map((item) => `${item.classroom}=${item.students}`).join(', ')}`);
    console.log('- Timetable: 10:15-11:15 and 11:15-12:15 sessions generated for today');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message || error);
    process.exit(1);
  }
}

seed();
