require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

const SUPERADMIN = {
  name: 'Shantanu Kulkarni',
  email: 'shantanuprogramming@gmail.com',
  password: 'shantanu@123',
  role: 'SuperAdmin'
};

const create = async () => {
  try {
    // Allow passing the MongoDB URI as a CLI argument for convenience
    const mongoUri = process.argv[2] || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('\nMissing MongoDB URI. Provide it via .env (MONGO_URI) or as a CLI argument.');
      console.error('Example: node createSuperAdmin.js "mongodb://localhost:27017/diems"\n');
      process.exit(1);
    }

    await connectDB(mongoUri);
    const exists = await User.findOne({ email: SUPERADMIN.email });
    if (exists) {
      console.log('SuperAdmin already exists:', exists.email);
      process.exit(0);
    }
    const user = await User.create(SUPERADMIN);
    console.log('Created SuperAdmin:', user.email);
    process.exit(0);
  } catch (err) {
    console.error('Error creating SuperAdmin:', err.message || err);
    process.exit(1);
  }
};

create();
