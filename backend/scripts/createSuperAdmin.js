require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const existing = await User.findOne({ email: 'admin@timiza.com' });

    if (existing) {
      console.log('⚠️ Super Admin already exists');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('super123', 10);

    await User.create({
      name: 'Timiza Super Admin',
      email: 'admin@timiza.com',
      password: hashedPassword,
      role: 'superadmin',
      schoolId: null
    });

    console.log('✅ Super Admin Created');

    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createSuperAdmin();
