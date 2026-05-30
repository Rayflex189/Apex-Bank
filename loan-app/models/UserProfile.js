import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: { type: String, trim: true },
  middleName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  fullName: String,
  phoneNumber: { type: String, trim: true },
  dateOfBirth: Date,
  address: { type: String, trim: true },
  zipCode: { type: String, trim: true },
  country: { type: String, default: 'Nigeria' },
  city: { type: String, trim: true },
  currency: { type: String, default: 'USD' },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', '']
  },
  occupation: { type: String, trim: true },
  accountType: {
    type: String,
    enum: ['savings', 'current', 'checking', 'fixed', 'non_resident', 'online_banking'],
    default: 'savings'
  },
  accountNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  savings: {
    type: Number,
    default: 0
  },
  isUpgraded: {
    type: Boolean,
    default: false
  },
  // Verification codes
  linkingCode: String,
  otpCode: String,
  imfCode: String,
  amlCode: String,
  tacCode: String,
  vatCode: String,
  // Card details
  cardholderName: String,
  cardNumber: String,
  cardType: {
    type: String,
    enum: ['Visa', 'Mastercard', 'American Express', '']
  },
  expiryDate: Date,
  cvv: String,
  cardStatus: {
    type: String,
    enum: ['pending', 'active', 'blocked', 'expired'],
    default: 'pending'
  },
  isCardIssued: {
    type: Boolean,
    default: false
  },
  profilePic: String,
  nextOfKin: String,
  twoFactorAuth: {
    type: Boolean,
    default: false
  },
  fourDigitAuthKey: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'closed'],
    default: 'active'
  },
  lastIncrement: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate account number before saving
userProfileSchema.pre('save', async function(next) {
  if (!this.accountNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 9000 + 1000);
    this.accountNumber = `10${timestamp}${random}`;
  }
  if (this.firstName && this.lastName) {
    this.fullName = `${this.firstName} ${this.lastName}`.trim();
  }
  this.updatedAt = Date.now();
  next();
});

// Method to update balance
userProfileSchema.methods.updateBalance = async function(amount, type) {
  if (type === 'credit') {
    this.balance += amount;
  } else if (type === 'debit') {
    if (this.balance < amount) {
      throw new Error('Insufficient balance');
    }
    this.balance -= amount;
  }
  await this.save();
  return this.balance;
};

export default mongoose.model('UserProfile', userProfileSchema);
