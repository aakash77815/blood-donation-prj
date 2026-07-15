const express = require('express');
const router = express.Router();

const {
  getDonors,
  getDonorById,
  createDonor,
  updateDonor,
  deleteDonor,
  searchDonors,
} = require('../controllers/donorController');

const { createDonorValidator, updateDonorValidator, searchDonorValidator } = require('../validators/donorValidators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/authMiddleware');

// All donor routes require a logged-in user
router.use(protect);

// IMPORTANT: /search must be registered BEFORE /:id — otherwise Express would
// match "search" as if it were an :id parameter and route it to getDonorById instead.
router.get('/search', searchDonorValidator, validate, searchDonors);

router.get('/', getDonors);
router.get('/:id', getDonorById);

router.post('/', authorize('admin'), createDonorValidator, validate, createDonor);
router.put('/:id', updateDonorValidator, validate, updateDonor);
router.delete('/:id', deleteDonor);

module.exports = router;
