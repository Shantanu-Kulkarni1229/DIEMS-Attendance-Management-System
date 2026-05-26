const mongoose = require('mongoose');

const LectureSessionSchema = new mongoose.Schema({
  timetableEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'TimetableEntry' },
  date: { type: Date, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  plannedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  actualTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  status: {
    type: String,
    enum: ['planned', 'substituted', 'cancelled', 'completed'],
    default: 'planned'
  },
  substitutionReason: { type: String, default: '' },
  substitutedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

LectureSessionSchema.index({ timetableEntry: 1, date: 1 }, { unique: true, sparse: true });
LectureSessionSchema.index({ classroom: 1, startDateTime: 1 }, { unique: true });
LectureSessionSchema.index({ date: 1, plannedTeacher: 1, actualTeacher: 1 });

module.exports = mongoose.model('LectureSession', LectureSessionSchema);
