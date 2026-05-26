const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  duration: { type: String, enum: ['Full Day', '1st Half', '2nd Half'], default: 'Full Day' },
  reason: { type: String, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

LeaveSchema.index({ student: 1, fromDate: 1, toDate: 1 });

module.exports = mongoose.model('Leave', LeaveSchema);
