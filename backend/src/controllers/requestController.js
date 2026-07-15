const BloodRequest = require('../models/BloodRequest');
const { ApiError } = require('../middleware/errorHandler');
const sendEmail = require('../utils/sendEmail');
const {
  requestCreatedTemplate,
  requestAcceptedTemplate,
  requestFulfilledTemplate,
} = require('../utils/emailTemplates');

// @desc    Create a new blood request
// @route   POST /api/requests
// @access  Private (any authenticated user)
const createRequest = async (req, res, next) => {
  try {
    const { patientName, bloodGroup, unitsNeeded, hospital, urgency, notes, requiredBy } = req.body;

    const request = await BloodRequest.create({
      requester: req.user._id,
      patientName,
      bloodGroup,
      unitsNeeded,
      hospital,
      urgency,
      notes,
      requiredBy: requiredBy || null,
    });

    // Best-effort confirmation email — never let a failed/unconfigured email
    // provider break the actual request creation, which is the important part.
    try {
      await sendEmail({
        to: req.user.email,
        subject: 'Blood Request Submitted',
        html: requestCreatedTemplate(req.user.name, request),
      });
    } catch (emailError) {
      console.error('⚠️  Request-created email failed to send:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List blood requests
//          - Admins see everything
//          - Everyone else sees: requests they created, OR open ("pending")
//            requests matching their own blood group (so donors can browse
//            and respond to requests relevant to them)
// @route   GET /api/requests?status=pending&mine=true
// @access  Private
const getRequests = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    let filter;

    if (req.user.role === 'admin') {
      filter = {};
    } else if (req.query.mine === 'true') {
      // Only requests this user created themselves
      filter = { requester: req.user._id };
    } else {
      // Default browse view: requests I created, OR open requests matching my blood group
      filter = {
        $or: [
          { requester: req.user._id },
          { bloodGroup: req.user.bloodGroup, status: 'pending' },
        ],
      };
    }

    // Optional extra filter by status (e.g. ?status=pending)
    if (req.query.status) {
      filter = filter.$or
        ? { $and: [filter, { status: req.query.status }] }
        : { ...filter, status: req.query.status };
    }

    const [requests, total] = await Promise.all([
      BloodRequest.find(filter)
        .populate('requester', 'name email phone')
        .populate('donor', 'name email phone')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      BloodRequest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single blood request by ID
// @route   GET /api/requests/:id
// @access  Private (requester, accepted donor, or admin)
const getRequestById = async (req, res, next) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('requester', 'name email phone')
      .populate('donor', 'name email phone');

    if (!request) {
      throw new ApiError(404, 'Blood request not found');
    }

    const isRequester = request.requester._id.toString() === req.user._id.toString();
    const isAssignedDonor = request.donor && request.donor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // Anyone else may only view it if it's still open (pending) and matches their blood group —
    // consistent with the "browse" visibility rule used in getRequests
    const isBrowsableMatch = request.status === 'pending' && request.bloodGroup === req.user.bloodGroup;

    if (!isRequester && !isAssignedDonor && !isAdmin && !isBrowsableMatch) {
      throw new ApiError(403, 'You are not authorized to view this request');
    }

    res.status(200).json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a blood request's status (accept / cancel / fulfill)
// @route   PATCH /api/requests/:id/status
// @access  Private (role-dependent — see logic below)
const updateRequestStatus = async (req, res, next) => {
  try {
    const { action } = req.body;
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      throw new ApiError(404, 'Blood request not found');
    }

    const isRequester = request.requester.toString() === req.user._id.toString();
    const isAssignedDonor = request.donor && request.donor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (action === 'accept') {
      // Only donors may accept, and only while the request is still open
      if (req.user.role !== 'donor') {
        throw new ApiError(403, 'Only donors can accept blood requests');
      }
      if (request.status !== 'pending') {
        throw new ApiError(400, `Cannot accept a request that is already "${request.status}"`);
      }

      request.donor = req.user._id;
      request.status = 'accepted';
      request.acceptedAt = new Date();
    }

    else if (action === 'cancel' || action === 'reject') {
      // 'reject' is just a clearer word for the same transition when an admin
      // is the one declining a request — the underlying status is still 'cancelled'.
      // Only the original requester or an admin may cancel/reject, and only before fulfillment
      if (!isRequester && !isAdmin) {
        throw new ApiError(403, 'Only the requester or an admin can cancel this request');
      }
      if (request.status === 'fulfilled') {
        throw new ApiError(400, 'Cannot cancel a request that has already been fulfilled');
      }

      request.status = 'cancelled';
      request.cancelledAt = new Date();
    }

    else if (action === 'fulfill') {
      // Only the accepted donor, the original requester, or an admin may mark it fulfilled
      if (!isAssignedDonor && !isRequester && !isAdmin) {
        throw new ApiError(403, 'You are not authorized to mark this request as fulfilled');
      }
      if (request.status !== 'accepted') {
        throw new ApiError(400, 'A request must be "accepted" before it can be marked fulfilled');
      }

      request.status = 'fulfilled';
      request.fulfilledAt = new Date();
    }

    await request.save();
    await request.populate('requester', 'name email phone');
    await request.populate('donor', 'name email phone');

    // Best-effort notification emails — failures here are logged but never
    // affect the actual status update, which has already been saved successfully.
    try {
      if (action === 'accept') {
        await sendEmail({
          to: request.requester.email,
          subject: 'A Donor Has Accepted Your Blood Request',
          html: requestAcceptedTemplate(request.requester.name, request.donor, request),
        });
      } else if (action === 'fulfill') {
        await sendEmail({
          to: request.requester.email,
          subject: 'Blood Request Fulfilled',
          html: requestFulfilledTemplate(request.requester.name, request),
        });
        if (request.donor?.email) {
          await sendEmail({
            to: request.donor.email,
            subject: 'Thank You — Blood Request Fulfilled',
            html: requestFulfilledTemplate(request.donor.name, request),
          });
        }
      }
    } catch (emailError) {
      console.error(`⚠️  "${action}" notification email failed to send:`, emailError.message);
    }

    const actionPastTense = {
      accept: 'accepted',
      cancel: 'cancelled',
      reject: 'rejected',
      fulfill: 'fulfilled',
    };

    res.status(200).json({
      success: true,
      message: `Request ${actionPastTense[action]} successfully`,
      request,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createRequest, getRequests, getRequestById, updateRequestStatus };
