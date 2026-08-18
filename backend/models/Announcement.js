const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    createdBy: {
      type: String,
      default: 'Administrator',
      trim: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'Announcement',
  announcementSchema
);
