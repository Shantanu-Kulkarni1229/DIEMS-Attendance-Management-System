const mongoose = require('mongoose');
const User = require('./User');

const SuperAdminSchema = new mongoose.Schema({});

module.exports = User.discriminator('SuperAdmin', SuperAdminSchema);
