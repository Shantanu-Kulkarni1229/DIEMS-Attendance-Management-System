const mongoose = require('mongoose');
const User = require('./User');

const AdminSchema = new mongoose.Schema({});

module.exports = User.discriminator('Admin', AdminSchema);
