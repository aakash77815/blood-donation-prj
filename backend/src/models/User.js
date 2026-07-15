const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return password in queries by default
    },
    role: {
      type: String,
      enum: ['donor', 'seeker', 'admin'],
      default: 'donor',
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: [true, 'Blood group is required'],
    },
    location: {
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
      },
      coordinates: {
        // GeoJSON format — required for geospatial queries in Phase 4
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0],
        },
      },
    },
    isAvailable: {
      type: Boolean,
      default: true, // donor availability toggle — used in search filtering (Phase 4)
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: true, // will default to false once OTP verification is added in Phase 5
    },
    isActive: {
      type: Boolean,
      default: true, // allows soft-disabling accounts without deleting them
    },
    resetPasswordToken: {
      type: String,
      select: false, // never returned in normal queries — only fetched explicitly during reset
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Geospatial index for location-based queries (used in Phase 4 search)
userSchema.index({ 'location.coordinates': '2dsphere' });

// Hash password before saving — only runs if password was modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive fields when converting to JSON (e.g., when sending user object in API responses)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Generates a raw reset token to email to the user, while storing only its
// SHA-256 hash in the database. This way, even if the database were ever
// compromised, the stolen hashes couldn't be used to reset anyone's password —
// only the original raw token (which only ever lived in the user's inbox) works.
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

  return resetToken; // the raw, unhashed token — this is what goes in the email link
};

module.exports = mongoose.model('User', userSchema);
