const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },

  class: { type: String, required: true },

  date: { type: Date, required: true, default: Date.now },

  records: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
      type: String, 
      enum: ['present', 'absent', 'late', 'excused'], 
      default: 'present' 
    },
    remarks: { type: String, default: '' }
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  createdAt: { type: Date, default: Date.now }
});

// ✅ FIXED: include school in unique constraint
attendanceSchema.index(
  { school: 1, class: 1, date: 1, createdBy: 1 },
  { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
