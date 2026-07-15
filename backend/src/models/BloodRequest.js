const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // whoever created the request (a seeker, or a donor requesting on behalf of someone)
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: [true, 'Blood group is required'],
    },
    unitsNeeded: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 unit must be requested'],
      max: [20, 'Cannot request more than 20 units at once'],
    },
    hospital: {
      name: {
        type: String,
        required: [true, 'Hospital name is required'],
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'Hospital city is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'Hospital state is required'],
        trim: true,
      },
    },
    urgency: {
      type: String,
      enum: ['normal', 'urgent', 'critical'],
      default: 'normal',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    requiredBy: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
    // Set once a donor accepts the request
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acceptedAt: { type: Date, default: null },
    fulfilledAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Speeds up the common query patterns: "my requests", "pending requests for blood group X"
bloodRequestSchema.index({ requester: 1, status: 1 });
bloodRequestSchema.index({ bloodGroup: 1, status: 1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
