const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');

// @desc    High-level overview counts for the dashboard's top cards
// @route   GET /api/admin/stats/overview
// @access  Private/Admin
const getOverview = async (req, res, next) => {
  try {
    const [
      totalDonors,
      activeDonors,
      availableDonors,
      totalSeekers,
      totalRequests,
      pendingRequests,
      acceptedRequests,
      fulfilledRequests,
      cancelledRequests,
    ] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'donor', isActive: true }),
      User.countDocuments({ role: 'donor', isActive: true, isAvailable: true }),
      User.countDocuments({ role: 'seeker' }),
      BloodRequest.countDocuments({}),
      BloodRequest.countDocuments({ status: 'pending' }),
      BloodRequest.countDocuments({ status: 'accepted' }),
      BloodRequest.countDocuments({ status: 'fulfilled' }),
      BloodRequest.countDocuments({ status: 'cancelled' }),
    ]);

    // Fulfillment rate = fulfilled / (all requests that reached a final state)
    const resolvedRequests = fulfilledRequests + cancelledRequests;
    const fulfillmentRate = resolvedRequests > 0
      ? Math.round((fulfilledRequests / resolvedRequests) * 100)
      : 0;

    res.status(200).json({
      success: true,
      overview: {
        totalDonors,
        activeDonors,
        availableDonors,
        totalSeekers,
        totalRequests,
        pendingRequests,
        acceptedRequests,
        fulfilledRequests,
        cancelledRequests,
        fulfillmentRate, // percentage, 0-100
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Count of requests grouped by status — feeds a pie/doughnut chart
// @route   GET /api/admin/stats/requests-by-status
// @access  Private/Admin
const getRequestsByStatus = async (req, res, next) => {
  try {
    const results = await BloodRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Ensure every possible status is present, even if count is 0 —
    // keeps chart legends consistent instead of silently omitting empty categories
    const allStatuses = ['pending', 'accepted', 'fulfilled', 'cancelled'];
    const data = allStatuses.map((status) => {
      const found = results.find((r) => r._id === status);
      return { status, count: found ? found.count : 0 };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Count of requests grouped by blood group — feeds a bar chart
// @route   GET /api/admin/stats/requests-by-bloodgroup
// @access  Private/Admin
const getRequestsByBloodGroup = async (req, res, next) => {
  try {
    const results = await BloodRequest.aggregate([
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
    ]);

    const allGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const data = allGroups.map((bloodGroup) => {
      const found = results.find((r) => r._id === bloodGroup);
      return { bloodGroup, count: found ? found.count : 0 };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Count of donors grouped by blood group — feeds a bar chart
// @route   GET /api/admin/stats/donors-by-bloodgroup
// @access  Private/Admin
const getDonorsByBloodGroup = async (req, res, next) => {
  try {
    const results = await User.aggregate([
      { $match: { role: 'donor', isActive: true } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
    ]);

    const allGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const data = allGroups.map((bloodGroup) => {
      const found = results.find((r) => r._id === bloodGroup);
      return { bloodGroup, count: found ? found.count : 0 };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Daily request volume over the last N days — feeds a line chart
// @route   GET /api/admin/stats/requests-trend?days=30
// @access  Private/Admin
const getRequestsTrend = async (req, res, next) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const results = await BloodRequest.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in every day in the range, even ones with zero requests, so the
    // line chart doesn't show misleading gaps or skip dates entirely
    const data = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const found = results.find((r) => r._id === dateStr);
      data.push({ date: dateStr, count: found ? found.count : 0 });
    }

    res.status(200).json({ success: true, days, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Top cities by donor count — feeds a report table
// @route   GET /api/admin/stats/top-locations
// @access  Private/Admin
const getTopLocations = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const results = await User.aggregate([
      { $match: { role: 'donor', isActive: true } },
      {
        $group: {
          _id: { city: '$location.city', state: '$location.state' },
          donorCount: { $sum: 1 },
        },
      },
      { $sort: { donorCount: -1 } },
      { $limit: limit },
    ]);

    const data = results.map((r) => ({
      city: r._id.city,
      state: r._id.state,
      donorCount: r.donorCount,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getRequestsByStatus,
  getRequestsByBloodGroup,
  getDonorsByBloodGroup,
  getRequestsTrend,
  getTopLocations,
};
