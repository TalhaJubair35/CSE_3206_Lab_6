const express = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { verifyFirebaseToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', verifyFirebaseToken, authController.register);
router.post('/login', verifyFirebaseToken, authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
