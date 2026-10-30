const express = require('express');
const eventController = require('../controllers/eventController');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

const router = express.Router();
const organizersAndAdmins = [authenticate, requireRole('organizer', 'admin')];

router.get('/', eventController.list);
router.get('/:id', eventController.get);
router.post('/', ...organizersAndAdmins, eventController.create);
router.patch('/:id', ...organizersAndAdmins, eventController.update);
router.delete('/:id', ...organizersAndAdmins, eventController.cancel);

module.exports = router;
