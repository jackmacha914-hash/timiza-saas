// models/School.js

const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  code: {
    type: String,
    unique: true,
    required: true
  },

  slug: {
    type: String,
    unique: true
  },

  active: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model('School', schoolSchema);