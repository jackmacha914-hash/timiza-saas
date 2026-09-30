// models/Bus.js

const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({

  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },

  number: {
    type: String,
    required: true
  },

  plate: {
    type: String,
    required: true
  },

  capacity: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['Active', 'Maintenance'],
    default: 'Active'
  }

}, { timestamps: true });

// Helpful indexes
BusSchema.index({ school: 1 });
BusSchema.index({ school: 1, plate: 1 });

module.exports =
  mongoose.models.Bus ||
  mongoose.model('Bus', BusSchema);
