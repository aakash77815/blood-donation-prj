const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');

// Small helper: only the donor themself or an admin may modify/delete a donor record
const isOwnerOrAdmin = (reqUser, donorId) => {
  return reqUser.role === 'admin' || reqUser._id.toString() === donorId.toString();
};

// @desc    Get all donors (with basic pagination)
// @route   GET /api/donors
// @access  Private (any authenticated user — donor, seeker, or admin)
const getDonors = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // cap to prevent abuse
    const skip = (page - 1) * limit;

    // Only ever list users whose role is 'donor' — seekers/admins aren't donor records
    const filter = { role: 'donor', isActive: true };

    const [donors, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: donors.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      donors: donors.map((d) => d.toSafeObject()),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single donor by ID
// @route   GET /api/donors/:id
// @access  Private
const getDonorById = async (req, res, next) => {
  try {
    const donor = await User.findOne({ _id: req.params.id, role: 'donor' });

    if (!donor) {
      throw new ApiError(404, 'Donor not found');
    }

    res.status(200).json({
      success: true,
      donor: donor.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually add a donor record (admin only — for donors who don't self-register)
// @route   POST /api/donors
// @access  Private/Admin
const createDonor = async (req, res, next) => {
  try {
    const { name, email, password, phone, bloodGroup, location } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const donor = await User.create({
      name,
      email,
      password,
      phone,
      role: 'donor', // forced — this endpoint only ever creates donors, never admins/seekers
      bloodGroup,
      location: {
        city: location?.city,
        state: location?.state,
        coordinates: {
          type: 'Point',
          coordinates: [location?.longitude || 0, location?.latitude || 0],
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Donor created successfully',
      donor: donor.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a donor's profile
// @route   PUT /api/donors/:id
// @access  Private (owner or admin)
const updateDonor = async (req, res, next) => {
  try {
    const donor = await User.findOne({ _id: req.params.id, role: 'donor' });

    if (!donor) {
      throw new ApiError(404, 'Donor not found');
    }

    if (!isOwnerOrAdmin(req.user, donor._id)) {
      throw new ApiError(403, 'You are not authorized to update this donor profile');
    }

    // Only apply fields that were actually sent — never blindly overwrite with undefined
    const allowedFields = ['name', 'phone', 'bloodGroup', 'isAvailable', 'lastDonationDate'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        donor[field] = req.body[field];
      }
    });

    if (req.body.location?.city) donor.location.city = req.body.location.city;
    if (req.body.location?.state) donor.location.state = req.body.location.state;
    if (req.body.location?.latitude !== undefined && req.body.location?.longitude !== undefined) {
      donor.location.coordinates = {
        type: 'Point',
        coordinates: [req.body.location.longitude, req.body.location.latitude],
      };
    }

    await donor.save();

    res.status(200).json({
      success: true,
      message: 'Donor profile updated successfully',
      donor: donor.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a donor — soft delete (deactivate) by default, hard delete for admin only
// @route   DELETE /api/donors/:id
// @access  Private (owner or admin)
const deleteDonor = async (req, res, next) => {
  try {
    const donor = await User.findOne({ _id: req.params.id, role: 'donor' });

    if (!donor) {
      throw new ApiError(404, 'Donor not found');
    }

    if (!isOwnerOrAdmin(req.user, donor._id)) {
      throw new ApiError(403, 'You are not authorized to delete this donor profile');
    }

    // Hard delete only if explicitly requested AND performed by an admin —
    // everyone else gets a soft delete (deactivation), which preserves data
    // and history rather than permanently destroying records.
    const hardDelete = req.query.hard === 'true' && req.user.role === 'admin';

    if (hardDelete) {
      await User.deleteOne({ _id: donor._id });
      return res.status(200).json({
        success: true,
        message: 'Donor permanently deleted',
      });
    }

    donor.isActive = false;
    await donor.save();

    res.status(200).json({
      success: true,
      message: 'Donor account deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search donors by blood group, city/state, and/or nearby location
// @route   GET /api/donors/search?bloodGroup=O+&city=Erode&lat=11.34&lng=77.72&maxDistanceKm=25
// @access  Private
const searchDonors = async (req, res, next) => {
  try {
    const {
      bloodGroup,
      city,
      state,
      lat,
      lng,
      maxDistanceKm,
      availability = 'available',
    } = req.query;

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = { role: 'donor', isActive: true };

    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (availability === 'available') filter.isAvailable = true;

    // Case-insensitive partial match — lets "erode" match "Erode", "Erode District", etc.
    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (state) filter['location.state'] = { $regex: state, $options: 'i' };

    // If coordinates are provided, do a real geospatial "nearby" search using the
    // 2dsphere index already defined on User.location.coordinates (see Phase 2 model).
    if (lat !== undefined && lng !== undefined) {
      const maxDistanceMeters = (parseFloat(maxDistanceKm) || 25) * 1000; // default 25km radius

      filter['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: maxDistanceMeters,
        },
      };

      // Note: $near already returns results sorted by distance (closest first),
      // and works alongside skip/limit, so no separate .sort() call is needed here.
      const donors = await User.find(filter).skip(skip).limit(limit);

      return res.status(200).json({
        success: true,
        count: donors.length,
        page,
        searchType: 'geospatial',
        donors: donors.map((d) => d.toSafeObject()),
      });
    }

    // No coordinates provided — fall back to a plain filtered + paginated search
    const [donors, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: donors.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      searchType: 'filter',
      donors: donors.map((d) => d.toSafeObject()),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDonors, getDonorById, createDonor, updateDonor, deleteDonor, searchDonors };
