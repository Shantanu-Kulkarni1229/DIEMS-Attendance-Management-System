const mongoose = require('mongoose');

const AttendanceCreditSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lectures: { type: Number, required: true, min: 1, default: 1 }
  },
  { timestamps: true }
);

AttendanceCreditSchema.index({ date: 1, classroom: 1, subject: 1, student: 1, teacher: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceCredit', AttendanceCreditSchema);
