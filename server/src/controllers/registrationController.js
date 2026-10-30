const registrationService = require('../services/registrationService');
const EmailNotifier = require('../services/notifier/EmailNotifier');

function createController({ notifier = new EmailNotifier() } = {}) {
  async function register(req, res) {
    try {
      const registration = await registrationService.registerForEvent({
        userId: req.user.id,
        eventId: req.params.eventId,
        notifier
      });
      return res.status(201).json({ registration });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  async function cancel(req, res) {
    try {
      const cancelled = await registrationService.cancel({
        user: req.user,
        eventId: req.params.eventId
      });
      return res.status(200).json({ cancelled });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  return { register, cancel };
}

module.exports = createController();
module.exports.createController = createController;
