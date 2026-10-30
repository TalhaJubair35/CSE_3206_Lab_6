const authService = require('../services/authService');

function serializeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };
}

function handleError(res, error) {
  return res.status(error.status || 500).json({ error: error.message });
}

async function register(req, res) {
  try {
    const user = await authService.registerUser({ firebaseUser: req.firebaseUser });
    return res.status(201).json({ user: serializeUser(user) });
  } catch (error) {
    return handleError(res, error);
  }
}

async function login(req, res) {
  try {
    const user = await authService.loginUser({ firebaseUser: req.firebaseUser });
    return res.status(200).json({ user: serializeUser(user) });
  } catch (error) {
    return handleError(res, error);
  }
}

function me(req, res) {
  return res.status(200).json({ user: req.user });
}

module.exports = { register, login, me };
