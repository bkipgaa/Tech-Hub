// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['client', 'technician', 'admin'],
    default: 'client'
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },

  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  profileImage: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'active'
  },

  // Stays & Spaces listing plan: free for 6 months from the first listing,
  // then KES 1,500 a month for all of the user's listings (utils/listingPlan.js)
  listingPlan: {
    freeUntil: { type: Date, default: null },
    paidUntil: { type: Date, default: null },
    payments: [{
      _id: false,
      amount: Number,
      months: Number,
      method: { type: String, enum: ['card', 'mpesa'] },
      reference: String,          // Paystack reference or M-Pesa receipt
      checkoutRequestID: String,  // M-Pesa STK request
      paidAt: Date,
    }],
    pending: {
      method: { type: String, enum: ['card', 'mpesa'] },
      reference: String,
      checkoutRequestID: String,
      amount: Number,
      initiatedAt: Date,
    },
  },
}, {
  timestamps: true
});

// ===========================================
// PRE-SAVE HOOK - Hash password before saving
// ===========================================
userSchema.pre('save', async function() {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return; // Just return, no next() needed
  }
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // No need to call next() - just complete the function
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);