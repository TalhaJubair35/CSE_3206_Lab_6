const jwt = require('jsonwebtoken');
const User = require('../models/User');

const roles = ['student', 'organizer', 'admin'];

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validateCredentials(email, password) {
  if (
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== 'string' ||
    password.length === 0
  ) {
    throw createError('A valid email and non-empty password are required', 400);
  }
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'campusevents-development-secret';
  }

  throw createError('JWT_SECRET must be configured in production', 500);
}

async function registerUser(input = {}) {
  const { email, password, role } = input || {};
  validateCredentials(email, password);

  if (role !== undefined && !roles.includes(role)) {
    throw createError('Invalid role', 400);
  }

  try {
    const user = await User.create({
      email: email.trim().toLowerCase(),
      passwordHash: await User.hashPassword(password),
      ...(role === undefined ? {} : { role })
    });

    return user;
  } catch (error) {
    if (error.code === 11000) {
      throw createError('Email is already registered', 400);
    }

    throw error;
  }
}

async function loginUser(input = {}) {
  const { email, password } = input || {};
  validateCredentials(email, password);

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    throw createError('Invalid email or password', 401);
  }

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    getJwtSecret()
  );
  return token;
}

module.exports = { registerUser, loginUser };
