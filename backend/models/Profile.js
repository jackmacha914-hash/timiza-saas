const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const profileSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
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
    unique: true,
    lowercase: true,
    trim: true
  },

  role: {
    type: String,
    enum: ['student', 'teacher', 'admin', 'accountant', 'superadmin'],
    default: 'teacher'
  },

  subjects: {
    type: [String],
    default: []
  },

  password: {
    type: String,
    required: true,
    select: false // 🔒 hides password in queries by default
  },

  photo: {
    type: String,
    default: ''
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

/**
 * Hash password before saving
 */
profileSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compare password method
 */
profileSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.Profile || mongoose.model('Profile', profileSchema);
