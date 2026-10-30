const eventService = require('../services/eventService');

function respondWithError(res, error) {
  return res.status(error.status || 500).json({ error: error.message });
}

async function list(req, res) {
  try {
    const events = await eventService.listEvents({
      upcomingOnly: req.query.upcomingOnly === 'true'
    });
    return res.status(200).json({ events });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function get(req, res) {
  try {
    const event = await eventService.getEvent(req.params.id);
    return res.status(200).json({ event });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function create(req, res) {
  try {
    const event = await eventService.createEvent({
      ...req.body,
      organizerId: req.user.id
    });
    return res.status(201).json({ event });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function update(req, res) {
  try {
    const event = await eventService.updateEvent(
      req.params.id,
      req.user.id,
      req.body || {}
    );
    return res.status(200).json({ event });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function cancel(req, res) {
  try {
    const event = await eventService.cancelEvent(req.params.id, req.user.id);
    return res.status(200).json({ event });
  } catch (error) {
    return respondWithError(res, error);
  }
}

module.exports = { list, get, create, update, cancel };
