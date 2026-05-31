const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  leaveType: { type: String, trim: true },
  attachmentUrl: { type: String, trim: true },
  attachmentPublicId: { type: String, trim: true },
  attachmentName: { type: String, trim: true },
  attachmentType: { type: String, trim: true },
  attachmentSize: { type: Number },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  duration: [{ type: String, trim: true }],
  reason: { type: String, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, { timestamps: true });

LeaveSchema.index({ student: 1, fromDate: 1, toDate: 1 });

module.exports = mongoose.model('Leave', LeaveSchema);
