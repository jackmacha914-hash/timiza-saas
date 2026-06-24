const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const schoolUserSchema = new mongoose.Schema({

  // ======================
  // MULTI-SCHOOL SUPPORT
  // ======================
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: [
      'admin',
      'teacher',
      'student'
    ],
    required: true
  },

  subject: {
    type: String,
    trim: true
  },

  studentClass: {
    type: String,
    trim: true
  },

  active: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});


// ======================
// PASSWORD HASHING
// ======================
schoolUserSchema.pre('save', async function(next) {

  if (!this.isModified('password'))
    return next();

  try {
    this.password = await bcrypt.hash(
      this.password,
      10
    );

    next();
  } catch (err) {
    next(err);
  }
});


// ======================
// PASSWORD CHECK
// ======================
schoolUserSchema.methods.comparePassword =
async function(password) {

  return bcrypt.compare(
    password,
    this.password
  );
};


// ======================
// INDEXES
// ======================

// Same email allowed in different schools
schoolUserSchema.index(
  {
    school: 1,
    email: 1
  },
  {
    unique: true
  }
);

schoolUserSchema.index({
  school: 1,
  role: 1
});

schoolUserSchema.index({
  school: 1,
  studentClass: 1
});

module.exports =
  mongoose.models.SchoolUser ||
  mongoose.model(
    'SchoolUser',
    schoolUserSchema
  );
