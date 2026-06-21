const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },

  text: {
    type: String,
    required: true,
  },

  createdBy: {
    type: String,
    default: 'Unknown',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
