const User = require('../models/User');

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeFirebaseUser(firebaseUser) {
  if (
    !firebaseUser ||
    typeof firebaseUser.uid !== 'string' ||
    typeof firebaseUser.email !== 'string' ||
    !firebaseUser.email.trim()
  ) {
    throw createError('A verified Firebase user with an email is required', 400);
  }

  return {
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email.trim().toLowerCase()
  };
}

async function syncFirebaseUser(firebaseUser) {
  const profile = normalizeFirebaseUser(firebaseUser);

  try {
    return await User.findOneAndUpdate(
      { firebaseUid: profile.firebaseUid },
      { $set: { email: profile.email } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) {
      throw createError('This email is already linked to another account', 409);
    }
    throw error;
  }
}

async function registerUser({ firebaseUser } = {}) {
  return syncFirebaseUser(firebaseUser);
}

async function loginUser({ firebaseUser } = {}) {
  return syncFirebaseUser(firebaseUser);
}

module.exports = { registerUser, loginUser, syncFirebaseUser };
