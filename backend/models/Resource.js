const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({

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

  path: {
    type: String,
    required: true
  },

  classAssigned: {
    type: String,
    required: true,
    trim: true
  },

  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, {
  timestamps: true
});


// ======================
// INDEXES
// ======================

// Get resources by school
resourceSchema.index({
  school: 1
});

// Get resources for a class in a school
resourceSchema.index({
  school: 1,
  classAssigned: 1
});

// Get resources uploaded by a user
resourceSchema.index({
  school: 1,
  uploadedBy: 1
});

module.exports =
  mongoose.models.Resource ||
  mongoose.model('Resource', resourceSchema);
