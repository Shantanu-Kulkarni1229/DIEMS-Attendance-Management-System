const cron = require('node-cron');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const AttendanceUtils = require('../utils/attendanceUtils');
const { sendEmail } = require('../services/emailService');

const checkAndAlert = async () => {
  try {
    // get all students
    const students = await Student.find({}).populate('classroom');
    for (const student of students) {
      const records = await Attendance.find({ 'records.student': student._id }).populate('subject');
      const summary = AttendanceUtils.calculateStudentAttendance(student._id, records);
      if (summary.overall.percentage < 75) {
        // send email alert
        const subject = 'Low Attendance Alert';
        const text = `Dear ${student.name},\nYour current attendance is ${summary.overall.percentage}%. Please contact your teacher.`;
        await sendEmail({ to: student.email, subject, text });
      }
    }
  } catch (err) {
    console.error('Error running attendance alert job:', err);
  }
};

const start = () => {
  // run daily at 08:00
  cron.schedule('0 8 * * *', () => {
    console.log('Running attendance alert job');
    checkAndAlert();
  });
  console.log('Attendance alert cron scheduled (daily at 08:00)');
};

module.exports = { start, checkAndAlert };
