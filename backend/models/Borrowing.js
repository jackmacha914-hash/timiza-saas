const mongoose = require('mongoose');

const borrowingSchema = new mongoose.Schema({

  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },

  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },

  bookTitle: {
    type: String,
    required: true
  },

  borrowerId: {
    type: String,
    required: true
  },

  borrowerName: {
    type: String,
    required: true
  },

  className: {
    type: String,
    required: true
  },

  issueDate: {
    type: Date,
    default: Date.now,
    required: true
  },

  dueDate: {
    type: Date,
    required: true
  },

  returnDate: {
    type: Date
  },

  returned: {
    type: Boolean,
    default: false
  },

  fine: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

// Indexes
borrowingSchema.index({ school: 1 });
borrowingSchema.index({ school: 1, bookId: 1, returned: 1 });
borrowingSchema.index({ school: 1, borrowerId: 1, returned: 1 });
borrowingSchema.index({ school: 1, dueDate: 1 });

module.exports =
  mongoose.models.Borrowing ||
  mongoose.model('Borrowing', borrowingSchema);
