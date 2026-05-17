const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const roles = ['SuperAdmin', 'Admin', 'Teacher', 'Student'];
const branches = ['CSE', 'CIVIL', 'MECH', 'CSE(AIML)', 'ENTC', 'MBA', 'BSH'];
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: roles, required: true },
  branch: { type: String, enum: branches },
  assignedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  assignedClassrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }],
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
