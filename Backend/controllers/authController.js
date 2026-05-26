const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  res.json({
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: !!user.mustChangePassword,
      prn: user.prn,
      rollNo: user.rollNo,
      className: user.className,
      division: user.division,
      branch: user.branch
    }
  });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      mustChangePassword: !!req.user.mustChangePassword,
      prn: req.user.prn,
      rollNo: req.user.rollNo,
      className: req.user.className,
      division: req.user.division,
      branch: req.user.branch
    }
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('currentPassword and newPassword are required');
  }
  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters long');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  res.json({
    message: 'Password updated successfully',
    mustChangePassword: false
  });
});
