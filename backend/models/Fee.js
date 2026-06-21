const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, default: 'Cash' },
  reference: String,
  notes: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  className: { type: String, required: true },

  academicTerm: { 
    type: String, 
    required: [true, 'Academic term is required'],
    enum: ['Term 1', 'Term 2', 'Term 3']
  },

  academicYear: { 
    type: String, 
    required: [true, 'Academic year is required'],
    match: [/^\d{4}\/\d{4}$/, 'Please provide a valid academic year in format YYYY/YYYY']
  },

  // ===============================
  // NEW CARRY FORWARD SYSTEM
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

  dueDate: { type: Date },

  payments: [paymentSchema],

  // ===============================
  // STATUS
  // ===============================
  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },

  description: String,
  feeType: { type: String, default: 'tuition' },

  // ===============================
  // LEGACY SUPPORT (DO NOT REMOVE)
  // ===============================
  feesPerTerm: Number,
  firstInstallment: Number,
  secondInstallment: Number,
  thirdInstallment: Number,
  bal: Number,
  amount: Number,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


// ===============================
// PRE-SAVE LOGIC (CARRY FORWARD FIX)
// ===============================
feeSchema.pre('save', function(next) {

  // fallback for old system
  this.currentTermFee =
    this.currentTermFee || this.feesPerTerm || 0;

  // TOTAL PAYABLE = CARRY FORWARD + CURRENT TERM
  this.totalPayable =
    (this.previousBalance || 0) +
    (this.currentTermFee || 0);

  // BALANCE CALCULATION
  this.balance =
    this.totalPayable - (this.paidAmount || 0);

  // STATUS LOGIC
  if (this.paidAmount <= 0) {
    this.status = 'pending';
  } 
  else if (this.paidAmount >= this.totalPayable) {
    this.status = 'paid';
  } 
  else {
    this.status = 'partially_paid';

    if (this.dueDate && new Date() > this.dueDate) {
      this.status = 'overdue';
    }
  }

  this.updatedAt = new Date();
  next();
});


// ===============================
// PAYMENT METHOD FIXED
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

  // RECALCULATE BALANCE
  this.balance =
    (this.totalPayable || 0) - this.paidAmount;

  await this.save();
  return this;
};


// ===============================
// INDEXES
// ===============================
feeSchema.index({ student: 1, status: 1 });
feeSchema.index({ className: 1, status: 1 });
feeSchema.index({ dueDate: 1 });

module.exports = mongoose.models.Fee || mongoose.model('Fee', feeSchema);
