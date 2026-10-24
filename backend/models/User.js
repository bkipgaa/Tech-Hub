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
  // Stamped into every JWT; bump it to revoke all of the user's sessions
  tokenVersion: {
    type: Number,
    default: 0
  },
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

  // What they chose on the signup form; decides where they land afterwards
  signupIntent: {
    type: String,
    enum: ['expert', 'client', 'lister', 'stay_seeker'],
  },
  preferences: {
    mainCategory: String,     // clients: the kind of expert they're after
    listingCategory: String,  // listers and stay seekers: a Stays & Spaces category id
  },

  // Device location shared at signup (required) and updated from the profile page.
  // Used for "near me" searches instead of asking the browser every time.
  location: {
    lat: Number,
    lng: Number,
    formattedAddress: String,
    updatedAt: Date,
  },
  address: {
    city: String,
    state: String,   // county
    country: { type: String, default: 'Kenya' },
  },

  // Stays & Spaces: 3 free months from the first listing (up to 5 listings),
  // then KES 200 per listing per month (utils/listingPlan.js)
  listingPlan: {
    freeUntil: { type: Date, default: null },
    paidUntil: { type: Date, default: null }, // old account-wide plan; carried over to listings on upgrade
    payments: [{
      _id: false,
      amount: Number,
      months: Number,
      listingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
      method: { type: String, enum: ['card', 'mpesa'] },
      reference: String,          // Paystack reference
      checkoutRequestID: String,  // M-Pesa STK request
      paidAt: Date,
    }],
    pending: {
      method: { type: String, enum: ['card', 'mpesa'] },
      reference: String,
      checkoutRequestID: String,
      amount: Number,
      months: Number,
      listingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
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