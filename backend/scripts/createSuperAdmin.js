require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const hashedPassword =
      await bcrypt.hash('super123', 10);

    await User.deleteOne({
      email: 'admin@timiza.com'
    });

    await User.create({
      name: 'Timiza Super Admin',
      email: 'admin@timiza.com',
      password: hashedPassword,
      role: 'superadmin'
    });

    console.log('✅ Super Admin Created');

    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createSuperAdmin();