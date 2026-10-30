const authService = require('../services/authService');

function handleError(res, error) {
  return res.status(error.status || 500).json({ error: error.message });
}

async function register(req, res) {
  try {
    const user = await authService.registerUser(req.body || {});
    return res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return handleError(res, error);
  }
}

async function login(req, res) {
  try {
    const token = await authService.loginUser(req.body || {});
    return res.status(200).json({ token });
  } catch (error) {
    return handleError(res, error);
  }
}

function me(req, res) {
  return res.status(200).json({ user: req.user });
}

module.exports = { register, login, me };
