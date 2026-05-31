const mongoose = require('mongoose');
const User = require('./User');

const PracticalBatchAssignmentSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  batchIds: [{ type: String, trim: true }],
  batchSnapshot: [
    {
      batchId: { type: String, trim: true },
      label: { type: String, trim: true },
      startRoll: { type: String, trim: true },
      endRoll: { type: String, trim: true },
      studentIds: [{ type: String, trim: true }],
      studentCount: { type: Number, default: 0 }
    }
  ]
}, { _id: false });

const TeacherSchema = new mongoose.Schema({
  assignedClassrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }],
  practicalBatchAssignments: [PracticalBatchAssignmentSchema]
});

module.exports = User.discriminator('Teacher', TeacherSchema);
