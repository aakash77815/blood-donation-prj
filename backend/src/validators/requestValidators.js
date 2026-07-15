const { body } = require('express-validator');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const createRequestValidator = [
  body('patientName')
    .trim()
    .notEmpty().withMessage('Patient name is required'),

  body('bloodGroup')
    .notEmpty().withMessage('Blood group is required')
    .isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),

  body('unitsNeeded')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('unitsNeeded must be between 1 and 20'),

  body('hospital.name')
    .trim()
    .notEmpty().withMessage('Hospital name is required'),

  body('hospital.city')
    .trim()
    .notEmpty().withMessage('Hospital city is required'),

  body('hospital.state')
    .trim()
    .notEmpty().withMessage('Hospital state is required'),

  body('urgency')
    .optional()
    .isIn(['normal', 'urgent', 'critical']).withMessage('Invalid urgency level'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),

  body('requiredBy')
    .optional({ nullable: true })
    .isISO8601().withMessage('requiredBy must be a valid date'),
];

// Body: { action: 'accept' | 'cancel' | 'reject' | 'fulfill' }
// Note: 'reject' is an alias for 'cancel' — same underlying status transition,
// but a clearer word for admins reviewing requests from a management UI.
const updateStatusValidator = [
  body('action')
    .notEmpty().withMessage('Action is required')
    .isIn(['accept', 'cancel', 'reject', 'fulfill']).withMessage('action must be accept, cancel, reject, or fulfill'),
];

module.exports = { createRequestValidator, updateStatusValidator };
