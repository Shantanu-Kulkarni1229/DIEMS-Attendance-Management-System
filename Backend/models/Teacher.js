const mongoose = require('mongoose');
const User = require('./User');

const TeacherSchema = new mongoose.Schema({
  assignedClassrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }]
});

module.exports = User.discriminator('Teacher', TeacherSchema);
