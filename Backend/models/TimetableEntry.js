const mongoose = require('mongoose');

const TimetableEntrySchema = new mongoose.Schema({
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  plannedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  dayOfWeek: { type: Number, enum: [0, 1, 2, 3, 4, 5, 6], required: true },
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true },   // HH:mm
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

TimetableEntrySchema.index({ classroom: 1, dayOfWeek: 1, startTime: 1, isActive: 1 });

module.exports = mongoose.model('TimetableEntry', TimetableEntrySchema);
