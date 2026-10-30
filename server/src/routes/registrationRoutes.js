const express = require('express');
const authenticate = require('../middleware/auth');
const registrationController = require('../controllers/registrationController');

const router = express.Router();

router.post('/:eventId', authenticate, registrationController.register);
router.delete('/:eventId', authenticate, registrationController.cancel);

module.exports = router;
