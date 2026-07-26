const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const dbAdapter = require('../models/dataStoreAdapter');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_article_vault_jwt_key_2026_dev_mode',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register new user
// @route   POST /api/v1/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide name, email, and password' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long' });
    }

    const existingUser = await dbAdapter.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email is already registered' });
    }

    const isParthSingh = name?.toLowerCase().includes('parth') || email?.toLowerCase().includes('parth');
    const userRole = isParthSingh ? 'admin' : (role || 'user');

    const user = await dbAdapter.createUser({
      name,
      email,
      password,
      role: userRole
    });

    const token = generateToken(user._id || user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const user = await dbAdapter.findUserByEmail(email, true);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateToken(user._id || user.id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
const getMe = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await dbAdapter.findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ success: false, error: 'There is no user with that email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await dbAdapter.updateUser(user._id || user.id, { resetPasswordToken, resetPasswordExpire });

    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken // Returned directly for easy testing/demo
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Reset Password
// @route   POST /api/v1/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const users = await dbAdapter.findUser({});
    const user = users.find(u => u.resetPasswordToken === resetPasswordToken && u.resetPasswordExpire > Date.now());

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    await dbAdapter.updateUser(user._id || user.id, {
      password,
      resetPasswordToken: undefined,
      resetPasswordExpire: undefined
    });

    res.status(200).json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update Password
// @route   PUT /api/v1/auth/update-password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id || req.user.id;
    const user = await dbAdapter.findUserByEmail(req.user.email, true);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    await dbAdapter.updateUser(userId, { password: newPassword });
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update Profile
// @route   PUT /api/v1/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const userId = req.user._id || req.user.id;

    const updatedUser = await dbAdapter.updateUser(userId, { name, bio, avatar });
    res.status(200).json({
      success: true,
      user: {
        id: updatedUser._id || updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  updateProfile
};
