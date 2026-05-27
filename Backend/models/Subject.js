const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String },
  year: { type: Number, enum: [1, 2, 3, 4], required: false },
  category: { type: String, enum: ['lecture', 'practical'], default: 'lecture' },
  assignedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Subject', SubjectSchema);
