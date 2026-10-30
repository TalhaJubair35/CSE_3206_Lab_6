const express = require('express');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get(
  '/attendance/:eventId',
  authenticate,
  requireRole('admin'),
  reportController.getAttendance
);

module.exports = router;
