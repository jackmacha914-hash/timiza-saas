const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
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

  license: {
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

// Faster lookups per school
DriverSchema.index({ school: 1, name: 1 });

module.exports =
  mongoose.models.Driver ||
  mongoose.model('Driver', DriverSchema);
