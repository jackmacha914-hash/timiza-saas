const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({

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

  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  }

}, {
  timestamps: true
});


// ======================
// INDEXES
// ======================

// Fast lookup of routes per school
routeSchema.index({
  school: 1
});

// Prevent duplicate route names in the same school
routeSchema.index({
  school: 1,
  name: 1
}, {
  unique: true
});

// Find routes assigned to buses
routeSchema.index({
  school: 1,
  busId: 1
});

module.exports =
  mongoose.models.Route ||
  mongoose.model('Route', routeSchema);
