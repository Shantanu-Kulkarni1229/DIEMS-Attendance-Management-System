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

const teacherDirectorySeeds = [
  { name: 'Sugandha Nandedkar', email: 'sugandhanandedkar@dietms.org' },
  { name: 'Sandeep Shah', email: 'sandeepshah@dietms.org' },
  { name: 'Madhubala Chaudhari', email: 'madhubalachaudhari@dietms.org' },
  { name: 'Sonali Shelke', email: 'sonalishelke@dietms.org' },
  { name: 'Manisha Mundhe', email: 'manishamundhe@dietms.org' },
  { name: 'Pravin Rathod', email: 'pravinrathod@dietms.org' },
  { name: 'Ashwini Gaikwad', email: 'ashwinigaikwad@dietms.org' },
  { name: 'Vishalsingh Chauhan', email: 'vishalchauhan@dietms.org' },
  { name: 'Gopal Burkul', email: 'gopalburkul@dietms.org' },
  { name: 'Pranali Bhalekar', email: 'pranalibhalekar@dietms.org' },
  { name: 'Ashwini Jagnade', email: 'ashwinijagnade@dietms.org' },
  { name: 'Amol Wakhare', email: 'amolwakhare@dietms.org' },
  { name: 'Payal Bansod', email: 'payalbansod@dietms.org' },
  { name: 'Rucha Galgali', email: 'ruchagalgali@dietms.org' },
  { name: 'Pournima Gawade', email: 'pournimagawade@dietms.org' },
  { name: 'Ashwini Swami', email: 'ashwiniswami@dietms.org' },
  { name: 'Prachi Waghmare', email: 'prachiwaghmare@dietms.org' },
  { name: 'Rutuja Kale', email: 'rskale.cse@dietms.org' },
  { name: 'Akanksha Nagdeve', email: 'akankshanagdeve@dietms.org' }
];

const classroomSeeds = [
  { name: 'FY-A', year: 'FY' },
  { name: 'SY-A', year: 'SY' },
  { name: 'TY-A', year: 'TY' },
  { name: 'BTECH-A', year: 'BTECH' }
];

const subjectSeeds = [
  { name: 'Machine Learning', code: 'ML101', year: 3, category: 'lecture' },
  { name: 'Computer Networks', code: 'CN201', year: 3, category: 'lecture' },
  { name: 'Compiler Design', code: 'CD301', year: 2, category: 'lecture' },
  { name: 'Engineering and Skill Development', code: 'E&SD401', year: 2, category: 'lecture' },
  { name: 'Internet of Things', code: 'IOT501', year: 4, category: 'lecture' },
  { name: 'Practical Subjects', code: 'PRAC', year: 4, category: 'practical' },
  { name: 'Competitive Programming', code: 'CP601', year: 4, category: 'lecture' },
  { name: 'Machine Learning Practical', code: 'MLP102', year: 3, category: 'practical' },
  { name: 'Professional Development', code: 'PD701', year: 4, category: 'lecture' },
  { name: 'Do It Yourself', code: 'DIY801', year: 4, category: 'practical' }
];

const studentRollCallFiles = [
  {
    fileName: 'TY A Roll Call List (1).csv',
    classroomName: 'TYCSE A',
    className: 'TY',
    division: 'A'
  },
  {
    fileName: 'TY B Roll call list (1).csv',
    classroomName: 'TYCSE B',
    className: 'TY',
    division: 'B'
  }
];

async function upsertUser(Model, payload) {
  const lookup = payload.extra?.prn
    ? { $or: [{ email: payload.email }, { prn: payload.extra.prn }] }
    : { email: payload.email };
  const existing = await Model.findOne(lookup);
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

const buildTeacherSeed = (entry) => ({
  name: entry.name,
  email: entry.email,
  password: 'diems@123',
  role: 'Teacher',
  branch: entry.branch || 'CSE'
});

const cleanCsvCell = (value) => String(value ?? '').trim().replace(/^"|"$/g, '');

const parseRollCallCsv = (csvText) => {
  const rows = csvText.split(/\r?\n/);
  const students = [];

  for (const row of rows) {
    const trimmed = row.trim();
    if (!trimmed) continue;
    if (/^SR\.NO|^Sr\. No\.|^Roll Call List|^Marathwada|^Deogiri|^Chhatrapati|^Department:|^Class :|^Class Teacher|^FF|^,/.test(trimmed)) continue;
    if (!/^(\d+|P1),/.test(trimmed)) continue;

    const cells = trimmed.split(',').map(cleanCsvCell);
    const srNo = cells[0];
    const rollNo = cells[1];
    const collegePrn = cells[2];
    const batuPrn = cells[3];
    const name = cells[4];
    const studentMobile = cells[7];
    const parentMobile = cells[8];
    const email = cells[9];

    if (!name || !rollNo || !collegePrn) continue;

    students.push({
      srNo,
      rollNo,
      prn: batuPrn,
      collegePrn,
      batuPrn,
      name,
      studentMobile,
      parentMobile,
      email
    });
  }

  return students;
};

async function seedRollCallStudents(admin, studentFileSeed) {
  const csvPath = require('path').join(__dirname, '..', studentFileSeed.fileName);
  const csvText = require('fs').readFileSync(csvPath, 'utf8');
  const rows = parseRollCallCsv(csvText);
  const classroom = await upsertClassroom({ name: studentFileSeed.classroomName, year: studentFileSeed.className }, admin._id);

  const seeded = [];
  for (const row of rows) {
    const seededStudent = await upsertUser(Student, {
      name: row.name,
      email: row.email || `${row.rollNo.toLowerCase()}@dietms.org`,
      password: 'diems@123',
      branch: 'CSE',
      extra: {
        prn: row.prn,
        collegePrn: row.collegePrn,
        batuPrn: row.batuPrn,
        rollNo: row.rollNo,
        className: studentFileSeed.className,
        division: studentFileSeed.division,
        classroom: classroom._id,
        phone: row.studentMobile,
        studentMobile: row.studentMobile,
        parentMobile: row.parentMobile,
        parentEmail: row.email
      }
    });
    seeded.push(seededStudent);
  }

  return { classroom, seeded };
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
    if (seed.category) existing.category = seed.category;
    if (createdBy) existing.createdBy = createdBy;
    await existing.save();
    return existing;
  }

  return Subject.create({
    name: seed.name,
    code: seed.code,
    year: seed.year,
    category: seed.category || 'lecture',
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
      password: 'diems@123',
      branch: 'CSE',
      extra: {
        assignedClassrooms: classrooms.slice(0, 2).map((classroom) => classroom._id),
        createdBy: admin._id
      }
    });

    const seededTeachers = [];
    for (const teacherSeed of teacherDirectorySeeds) {
      const seededTeacher = await upsertUser(Teacher, buildTeacherSeed(teacherSeed));
      seededTeachers.push(seededTeacher);
    }

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
      { classroom: ttMl.classroom, startDateTime: mlTimes.start },
      {
        $set: {
          timetableEntry: ttMl._id,
          date: dayStart,
          startDateTime: mlTimes.start,
          endDateTime: mlTimes.end,
          classroom: ttMl.classroom,
          subject: ttMl.subject,
          plannedTeacher: ttMl.plannedTeacher,
          actualTeacher: null,
          status: 'planned',
          substitutionReason: '',
          substitutedBy: null
        }
      },
      { upsert: true, new: true }
    );

    await LectureSession.findOneAndUpdate(
      { classroom: ttCn.classroom, startDateTime: cnTimes.start },
      {
        $set: {
          timetableEntry: ttCn._id,
          date: dayStart,
          startDateTime: cnTimes.start,
          endDateTime: cnTimes.end,
          classroom: ttCn.classroom,
          subject: ttCn.subject,
          plannedTeacher: ttCn.plannedTeacher,
          actualTeacher: null,
          status: 'planned',
          substitutionReason: '',
          substitutedBy: null
        }
      },
      { upsert: true, new: true }
    );

    const student = await upsertUser(Student, {
      ...seedUsers.student,
      password: 'diems@123',
      extra: {
        prn: 'UI2026001',
        rollNo: '01',
        className: 'SY',
        division: 'A',
        branch: 'CSE',
        classroom: classrooms[1]._id,
        phone: '9999999999',
        studentMobile: '9999999999',
        parentMobile: '8888888888',
        parentEmail: 'ui.parent@diems.test'
      }
    });

    const rollCallImports = [];
    for (const fileSeed of studentRollCallFiles) {
      rollCallImports.push(await seedRollCallStudents(admin, fileSeed));
    }

    console.log('Seed complete. Created/updated:');
    console.log(`- SuperAdmin: ${superAdmin.email}`);
    console.log(`- Admin: ${admin.email}`);
    console.log(`- Teacher: ${teacher.email}`);
    console.log(`- Additional teachers: ${seededTeachers.length}`);
    console.log(`  ${seededTeachers.map((item) => `${item.name} <${item.email}>`).join('\n  ')}`);
    console.log(`- Student: ${student.email}`);
    console.log(`- Roll call imports: ${rollCallImports.reduce((total, entry) => total + entry.seeded.length, 0)} students`);
    for (const imported of rollCallImports) {
      console.log(`  - ${imported.classroom.name}: ${imported.seeded.length} students`);
    }
    console.log(`- Classrooms: ${classrooms.map((classroom) => classroom.name).join(', ')}`);
    console.log(`- Subjects: ${subjects.map((subject) => `${subject.name} [${subject.category || 'lecture'}]`).join(', ')}`);
    console.log('- Timetable: 10:15-11:15 and 11:15-12:15 sessions generated for today');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message || error);
    process.exit(1);
  }
}

seed();
