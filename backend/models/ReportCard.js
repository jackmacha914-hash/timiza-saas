const mongoose = require('mongoose');

const reportCardSchema = new mongoose.Schema({

  // ======================
  // MULTI-SCHOOL SUPPORT
  // ======================
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  studentName: {
    type: String,
    required: true,
    trim: true
  },

  year: {
    type: String,
    required: true
  },

  term: {
    type: String,
    required: true
  },

  comments: {
    type: String,
    default: ''
  },

  path: {
    type: String,
    required: true
  },

  htmlPath: {
    type: String,
    required: true
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },

  htmlContent: {
    type: String,
    default: ''
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// ======================
// VIRTUALS
// ======================
reportCardSchema.virtual('fileUrl').get(function () {
  if (!this.path) return null;
  return `/uploads/report-cards/${this.path}`;
});


// ======================
// INDEXES
// ======================

// Fast student lookups per school
reportCardSchema.index({
  school: 1,
  studentId: 1
});

// One report card per student per term/year per school
reportCardSchema.index({
  school: 1,
  studentId: 1,
  year: 1,
  term: 1
}, {
  unique: true
});

// Admin queries
reportCardSchema.index({
  school: 1,
  uploadedBy: 1
});

reportCardSchema.index({
  school: 1,
  status: 1
});


// ======================
// CLEANUP
// ======================
reportCardSchema.pre('save', function(next) {

  if (this.studentName) {
    this.studentName = this.studentName.trim();
  }

  if (this.term) {
    this.term = this.term
      .trim()
      .split(' ')
      .map(word =>
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
      )
      .join(' ');
  }

  next();
});

module.exports =
  mongoose.models.ReportCard ||
  mongoose.model('ReportCard', reportCardSchema);
