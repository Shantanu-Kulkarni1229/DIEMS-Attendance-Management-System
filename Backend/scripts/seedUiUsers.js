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

const buildSessionTimes = (date, startTime, endTime) => {
  const start = new Date(date);
  const end = new Date(date);
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  start.setHours(sh, sm, 0, 0);
  end.setHours(eh, em, 0, 0);
  return { start, end };
};

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
        assignedClassrooms: classrooms.slice(0, 2).map((classroom) => classroom._id)
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

    await LectureSession.findOneAndUpdate(
      { timetableEntry: ttMl._id, date: dayStart },
      {
        $set: {
          startDateTime: mlTimes.start,
          endDateTime: mlTimes.end,
          classroom: ttMl.classroom,
          subject: ttMl.subject,
          plannedTeacher: ttMl.plannedTeacher,
          status: 'planned'
        }
      },
      { upsert: true, new: true }
    );

    await LectureSession.findOneAndUpdate(
      { timetableEntry: ttCn._id, date: dayStart },
      {
        $set: {
          startDateTime: cnTimes.start,
          endDateTime: cnTimes.end,
          classroom: ttCn.classroom,
          subject: ttCn.subject,
          plannedTeacher: ttCn.plannedTeacher,
          status: 'planned'
        }
      },
      { upsert: true, new: true }
    );

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

    console.log('Seed complete. Created/updated:');
    console.log(`- SuperAdmin: ${superAdmin.email}`);
    console.log(`- Admin: ${admin.email}`);
    console.log(`- Teacher: ${teacher.email}`);
    console.log(`- Student: ${student.email}`);
    console.log(`- Classrooms: ${classrooms.map((classroom) => classroom.name).join(', ')}`);
    console.log(`- Subjects: ${subjects.map((subject) => subject.name).join(', ')}`);
    console.log('- Timetable: 10:15-11:15 and 11:15-12:15 sessions generated for today');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message || error);
    process.exit(1);
  }
}

seed();
