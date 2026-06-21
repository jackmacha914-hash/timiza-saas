const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },

  paymentDate: {
    type: Date,
    default: Date.now
  },

  paymentMethod: {
    type: String,
    default: 'Cash'
  },

  reference: String,
  notes: String,

  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

const feeSchema = new mongoose.Schema({

  // ===============================
  // SAAS TENANT ISOLATION
  // ===============================
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  className: {
    type: String,
    required: true
  },

  academicTerm: {
    type: String,
    required: [true, 'Academic term is required'],
    enum: ['Term 1', 'Term 2', 'Term 3']
  },

  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [
      /^\d{4}\/\d{4}$/,
      'Please provide a valid academic year in format YYYY/YYYY'
    ]
  },

  // ===============================
  // CARRY FORWARD SYSTEM
  // ===============================
  previousBalance: {
    type: Number,
    default: 0
  },

  currentTermFee: {
    type: Number,
    default: 0
  },

  totalPayable: {
    type: Number,
    default: 0
  },

  // ===============================
  // PAYMENT TRACKING
  // ===============================
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  balance: {
    type: Number,
    default: 0
  },

  dueDate: Date,

  payments: [paymentSchema],

  // ===============================
  // STATUS
  // ===============================
  status: {
    type: String,
    enum: [
      'pending',
      'partially_paid',
      'paid',
      'overdue',
      'cancelled'
    ],
    default: 'pending'
  },

  description: String,

  feeType: {
    type: String,
    default: 'tuition'
  },

  // ===============================
  // LEGACY SUPPORT
  // ===============================
  feesPerTerm: Number,
  firstInstallment: Number,
  secondInstallment: Number,
  thirdInstallment: Number,
  bal: Number,
  amount: Number

}, { timestamps: true });


// ===============================
// PRE-SAVE LOGIC
// ===============================
feeSchema.pre('save', function(next) {

  this.currentTermFee =
    this.currentTermFee || this.feesPerTerm || 0;

  this.totalPayable =
    (this.previousBalance || 0) +
    (this.currentTermFee || 0);

  this.balance =
    this.totalPayable - (this.paidAmount || 0);

  if (this.paidAmount <= 0) {
    this.status = 'pending';
  } else if (this.paidAmount >= this.totalPayable) {
    this.status = 'paid';
  } else {
    this.status = 'partially_paid';

    if (this.dueDate && new Date() > this.dueDate) {
      this.status = 'overdue';
    }
  }

  next();
});


// ===============================
// RECORD PAYMENT
// ===============================
feeSchema.methods.recordPayment = async function(paymentData) {

  const payment = {
    amount: paymentData.amount,
    paymentDate: paymentData.paymentDate || new Date(),
    paymentMethod: paymentData.paymentMethod || 'Cash',
    reference: paymentData.reference || `PAY-${Date.now()}`,
    notes: paymentData.notes,
    recordedBy: paymentData.recordedBy
  };

  this.payments.push(payment);

  this.paidAmount =
    (this.paidAmount || 0) + Number(payment.amount);

  await this.save();

  return this;
};


// ===============================
// INDEXES
// ===============================
feeSchema.index({ school: 1, student: 1 });
feeSchema.index({ school: 1, status: 1 });
feeSchema.index({ school: 1, className: 1 });
feeSchema.index({ school: 1, dueDate: 1 });

module.exports =
  mongoose.models.Fee ||
  mongoose.model('Fee', feeSchema);
