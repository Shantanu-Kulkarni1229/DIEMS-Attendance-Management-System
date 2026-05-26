const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  lectureSession: { type: mongoose.Schema.Types.ObjectId, ref: 'LectureSession', default: null },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  records: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      status: { type: String, enum: ['present', 'absent'], required: true }
    }
  ]
}, { timestamps: true });

AttendanceSchema.index({ date: 1, classroom: 1, subject: 1 }, { unique: true });
AttendanceSchema.index({ lectureSession: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
