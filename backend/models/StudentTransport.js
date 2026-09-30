const mongoose = require('mongoose');

const StudentTransportSchema = new mongoose.Schema({

  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },

  studentId: {
    type: String,
    required: true
  },

  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  },

  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  }

}, {
  timestamps: true
});

// Useful indexes
StudentTransportSchema.index({
  school: 1,
  studentId: 1
});

StudentTransportSchema.index({
  school: 1,
  busId: 1
});

StudentTransportSchema.index({
  school: 1,
  routeId: 1
});

module.exports =
  mongoose.models.StudentTransport ||
  mongoose.model('StudentTransport', StudentTransportSchema);
