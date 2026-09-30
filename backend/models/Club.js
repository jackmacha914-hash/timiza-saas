const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({

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

  description: {
    type: String,
    required: true,
    trim: true
  },

  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]

}, {
  timestamps: true
});

// Prevent duplicate club names within the same school
clubSchema.index({
  school: 1,
  name: 1
}, {
  unique: true
});

module.exports =
  mongoose.models.Club ||
  mongoose.model('Club', clubSchema);
