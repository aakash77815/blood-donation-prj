const { body, query } = require('express-validator');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Used when an admin manually adds a donor record.
// Mirrors registerValidator since creating a donor means creating a User with role 'donor'.
const createDonorValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/).withMessage('Phone number must be exactly 10 digits'),

  body('bloodGroup')
    .notEmpty().withMessage('Blood group is required')
    .isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),

  body('location.city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('location.state')
    .trim()
    .notEmpty().withMessage('State is required'),
];

// Used for updates — every field optional (PATCH-style), but validated if present.
const updateDonorValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/).withMessage('Phone number must be exactly 10 digits'),

  body('bloodGroup')
    .optional()
    .isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),

  body('location.city')
    .optional()
    .trim()
    .notEmpty().withMessage('City cannot be empty'),

  body('location.state')
    .optional()
    .trim()
    .notEmpty().withMessage('State cannot be empty'),

  body('isAvailable')
    .optional()
    .isBoolean().withMessage('isAvailable must be true or false'),

  body('lastDonationDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('lastDonationDate must be a valid date'),

  // Prevent these fields from ever being set via the update endpoint
  body('email').not().exists().withMessage('Email cannot be changed via this endpoint'),
  body('password').not().exists().withMessage('Password cannot be changed via this endpoint'),
  body('role').not().exists().withMessage('Role cannot be changed via this endpoint'),
];

// Used for GET /api/donors/search — every filter is optional
const searchDonorValidator = [
  query('bloodGroup')
    .optional()
    .isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),

  query('city')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('City filter cannot be empty'),

  query('state')
    .optional()
    .trim()
    .isLength({ min: 1 }).withMessage('State filter cannot be empty'),

  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('lat must be a valid latitude'),

  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('lng must be a valid longitude'),

  query('maxDistanceKm')
    .optional()
    .isFloat({ min: 0.1, max: 500 }).withMessage('maxDistanceKm must be between 0.1 and 500'),

  query('availability')
    .optional()
    .isIn(['available', 'all']).withMessage('availability must be "available" or "all"'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

module.exports = { createDonorValidator, updateDonorValidator, searchDonorValidator };
