const { getFirebaseAuth } = require('../config/firebase');
const User = require('../models/User');

function getBearerToken(req) {
  const authorization = req.get('authorization');
  const match = authorization && authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

async function verifyFirebaseToken(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let firebaseAuth;
  try {
    firebaseAuth = getFirebaseAuth();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    if (!decoded.uid || !decoded.email) {
      return res.status(401).json({ error: 'Firebase account must have an email address' });
    }

    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired Firebase token' });
  }
}

async function authenticate(req, res, next) {
  return verifyFirebaseToken(req, res, async () => {
    try {
      const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
      if (!user) {
        return res.status(401).json({ error: 'User profile is not registered' });
      }

      req.user = {
        id: user._id.toString(),
        firebaseUid: user.firebaseUid,
        email: user.email,
        role: user.role
      };
      return next();
    } catch (error) {
      return next(error);
    }
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

module.exports = authenticate;
module.exports.verifyFirebaseToken = verifyFirebaseToken;
module.exports.requireRole = requireRole;
