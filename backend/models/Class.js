const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({

  // =====================================================
  // SCHOOL / TENANT
  // =====================================================
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },

  // =====================================================
  // CLASS NAME
  // =====================================================
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },

  // =====================================================
  // EDUCATION LEVEL
  // =====================================================
  level: {
    type: String,
    enum: [
      'Pre-School',
      'Primary',
      'Elementary',
      'Middle School',
      'High School'
    ],
    required: [true, 'Education level is required']
  },

  // =====================================================
  // SECTION
  // =====================================================
  section: {
    type: String,
    trim: true,
    default: ''
  },

  // =====================================================
  // CAPACITY
  // =====================================================
  capacity: {
    type: Number,
    required: [true, 'Class capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    default: 30
  },

  // =====================================================
  // STUDENT COUNT
  // =====================================================
  studentCount: {
    type: Number,
    default: 0
  },

  // =====================================================
  // TEACHER IN CHARGE
  // =====================================================
  teacherInCharge: {
    type: String,
    trim: true,
    default: ''
  },

  // =====================================================
  // ROOM
  // =====================================================
  roomNumber: {
    type: String,
    trim: true,
    default: ''
  },

  // =====================================================
  // ACADEMIC YEAR
  // =====================================================
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },

  // =====================================================
  // NOTES
  // =====================================================
  notes: {
    type: String,
    trim: true,
    default: ''
  },

  // =====================================================
  // STUDENTS
  //
  // IMPORTANT:
  // Students in your current system are stored in User.
  //
  // DO NOT use ref: 'Student'
  // =====================================================
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // =====================================================
  // TEACHER
  // =====================================================
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true
});


// =====================================================
// SAAS-SAFE INDEXES
// =====================================================

// Same class name can exist in different schools,
// but not twice in the same school/year.
classSchema.index(
  {
    school: 1,
    name: 1,
    academicYear: 1
  },
  {
    unique: true
  }
);


// Same level/section combination cannot be duplicated
// inside the same school and academic year.
classSchema.index(
  {
    school: 1,
    level: 1,
    section: 1,
    academicYear: 1
  },
  {
    unique: true
  }
);


// Quickly find classes by school and teacher.
classSchema.index({
  school: 1,
  teacherInCharge: 1
});


// Quickly find classes for a particular teacher.
classSchema.index({
  school: 1,
  teacher: 1
});


// =====================================================
// MODEL
// =====================================================

module.exports =
  mongoose.models.Class ||
  mongoose.model('Class', classSchema);
