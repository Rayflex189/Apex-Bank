import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100
  },
  loanAmount: {
    type: Number,
    required: true,
    min: 100
  },
  loanType: {
    type: String,
    enum: ['personal', 'mortgage', 'auto', 'business', 'education', 'emergency', 'payday'],
    required: true
  },
  purpose: { type: String, trim: true },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 360
  },
  loanDuration: String,
  employmentStatus: {
    type: String,
    enum: ['employed', 'self_employed', 'unemployed', 'retired', 'student', '']
  },
  annualIncome: Number,
  repaymentFrequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly'],
    default: 'monthly'
  },
  collateral: String,
  requestedDate: {
    type: Date,
    default: Date.now
  },
  notes: String,
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Disbursed', 'Completed', 'Defaulted'],
    default: 'Pending'
  },
  interestRate: Number,
  processingFee: Number,
  totalAmountDue: Number,
  monthlyPayment: Number,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  reviewedAt: Date,
  disbursedAt: Date,
  completedAt: Date,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate loan details before saving
loanSchema.pre('save', function(next) {
  const amount = this.amount || this.loanAmount;
  const duration = this.duration || parseInt(this.loanDuration?.split(' ')[0]) || 12;
  
  if (amount && duration) {
    // Interest rate calculation based on loan type
    const typeRates = {
      mortgage: 3.5,
      auto: 4.5,
      education: 4.0,
      emergency: 10.0,
      payday: 10.0,
      business: 6.5,
      personal: 7.5
    };
    
    let rate = typeRates[this.loanType] || 5.0;
    
    // Adjust for duration
    if (duration > 60) rate += 0.5;
    if (duration > 120) rate += 0.5;
    
    // Adjust for income ratio if available
    if (this.annualIncome && amount) {
      const ratio = amount / this.annualIncome;
      if (ratio > 2) rate += 1.0;
      else if (ratio < 0.5) rate -= 0.5;
    }
    
    // Calculate total with simple interest
    const total = amount * (1 + (rate / 100) * (duration / 12));
    this.interestRate = parseFloat(rate.toFixed(2));
    this.totalAmountDue = parseFloat(total.toFixed(2));
    this.processingFee = parseFloat((amount * 0.05).toFixed(2));
    this.monthlyPayment = parseFloat((this.totalAmountDue / duration).toFixed(2));
  }
  
  this.updatedAt = Date.now();
  next();
});

// Method to check if loan can be approved
loanSchema.methods.canApprove = function() {
  return this.status === 'Pending';
};

// Method to approve loan
loanSchema.methods.approve = async function(approverId) {
  if (!this.canApprove()) {
    throw new Error('Loan cannot be approved');
  }
  this.status = 'Approved';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  this.reviewedAt = new Date();
  await this.save();
  return this;
};

// Method to reject loan
loanSchema.methods.reject = async function() {
  if (!this.canApprove()) {
    throw new Error('Loan cannot be rejected');
  }
  this.status = 'Rejected';
  this.reviewedAt = new Date();
  await this.save();
  return this;
};

export default mongoose.model('Loan', loanSchema);
