const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  domain: {
    type: String,
    default: ''
  },

  logo: {
    type: String,
    default: ''
  },

  contactEmail: {
    type: String,
    default: ''
  },

  phone: {
    type: String,
    default: ''
  },

  address: {
    type: String,
    default: ''
  },

  active: {
    type: Boolean,
    default: true
  }
  subscription: {
  plan: {
    type: String,
    enum: [
      "Trial",
      "Starter",
      "Professional",
      "Enterprise"
    ],
    default: "Trial"
  },

  status: {
    type: String,
    enum: [
      "Active",
      "Expired",
      "Suspended"
    ],
    default: "Active"
  },

  startDate: {
    type: Date,
    default: Date.now
  },

  endDate: {
    type: Date
  },

}, {
  timestamps: true
});


// Fast tenant lookup
schoolSchema.index({
  slug: 1
});

schoolSchema.index({
  code: 1
});

module.exports =
  mongoose.models.School ||
  mongoose.model('School', schoolSchema);
