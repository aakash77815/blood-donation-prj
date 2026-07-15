const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { ApiError } = require('../middleware/errorHandler');
const sendEmail = require('../utils/sendEmail');
const { passwordResetTemplate } = require('../utils/emailTemplates');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, bloodGroup, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    // Build location object with default GeoJSON point (real coordinates
    // will be set later via a geocoding step or browser geolocation on the frontend)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'donor',
      bloodGroup,
      location: {
        city: location?.city,
        state: location?.state,
        coordinates: {
          type: 'Point',
          coordinates: [
            location?.longitude || 0,
            location?.latitude || 0,
          ],
        },
      },
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log in an existing user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password since schema excludes it by default
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'This account has been deactivated');
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the `protect` middleware
    res.status(200).json({
      success: true,
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond with the same generic message whether or not the email
    // exists — this prevents attackers from using this endpoint to discover
    // which email addresses are registered (the same principle used in login).
    const genericResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password — Smart Blood Donor Finder',
        html: passwordResetTemplate(user.name, resetUrl),
      });
    } catch (emailError) {
      // Email failed to send (e.g. placeholder SMTP credentials in .env) —
      // roll back the token so it isn't left dangling and unusable, but don't
      // fail the request with a scary error; log it for the developer instead.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('⚠️  Password reset email failed to send:', emailError.message);
    }

    res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using the token emailed to the user
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      throw new ApiError(400, 'Password reset token is invalid or has expired');
    }

    user.password = req.body.password; // pre-save hook re-hashes this automatically
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log the user straight in after a successful reset — better UX than
    // forcing them to reset the password and then separately log in again.
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
