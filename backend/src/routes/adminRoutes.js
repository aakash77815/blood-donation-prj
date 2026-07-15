const express = require('express');
const router = express.Router();

const {
  getOverview,
  getRequestsByStatus,
  getRequestsByBloodGroup,
  getDonorsByBloodGroup,
  getRequestsTrend,
  getTopLocations,
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Every route in this file requires a logged-in admin — no exceptions
router.use(protect, authorize('admin'));

router.get('/stats/overview', getOverview);
router.get('/stats/requests-by-status', getRequestsByStatus);
router.get('/stats/requests-by-bloodgroup', getRequestsByBloodGroup);
router.get('/stats/donors-by-bloodgroup', getDonorsByBloodGroup);
router.get('/stats/requests-trend', getRequestsTrend);
router.get('/stats/top-locations', getTopLocations);

module.exports = router;
