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

function isOrganizerEmail(email) {
  const allowedEmails = (process.env.ORGANIZER_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email);
}

function isAdminEmail(email) {
  const allowedEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email);
}

async function syncFirebaseUser(firebaseUser) {
  const profile = normalizeFirebaseUser(firebaseUser);

  try {
    const user = await User.findOne({ firebaseUid: profile.firebaseUid });

    if (user) {
      let changed = false;
      if (user.email !== profile.email) {
        user.email = profile.email;
        changed = true;
      }
      const assignedRole = isAdminEmail(profile.email)
        ? 'admin'
        : user.role === 'student' && isOrganizerEmail(profile.email)
          ? 'organizer'
          : user.role;
      if (user.role !== assignedRole) {
        user.role = assignedRole;
        changed = true;
      }
      return changed ? user.save() : user;
    }

    return await User.create({
      ...profile,
      role: isAdminEmail(profile.email)
        ? 'admin'
        : isOrganizerEmail(profile.email)
          ? 'organizer'
          : 'student'
    });
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

module.exports = {
  registerUser,
  loginUser,
  syncFirebaseUser,
  isOrganizerEmail,
  isAdminEmail
};
