const mongoose = require('mongoose');
const User = require('./User');

const StudentSchema = new mongoose.Schema({
  prn: { type: String, required: true, unique: true, trim: true, index: true },
  rollNo: { type: String, required: true, trim: true },
  className: { type: String, required: true, trim: true },
  division: { type: String, required: true, trim: true, uppercase: true },
  phone: { type: String, trim: true },
  parentEmail: { type: String, trim: true, lowercase: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }
});

module.exports = User.discriminator('Student', StudentSchema);
