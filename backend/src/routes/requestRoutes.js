const express = require('express');
const router = express.Router();

const {
  createRequest,
  getRequests,
  getRequestById,
  updateRequestStatus,
} = require('../controllers/requestController');

const { createRequestValidator, updateStatusValidator } = require('../validators/requestValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');

// All request routes require a logged-in user
router.use(protect);

router.get('/', getRequests);
router.get('/:id', getRequestById);
router.post('/', createRequestValidator, validate, createRequest);
router.patch('/:id/status', updateStatusValidator, validate, updateRequestStatus);

module.exports = router;
