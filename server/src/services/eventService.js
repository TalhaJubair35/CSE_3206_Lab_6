const Event = require('../models/Event');

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function createEvent({ organizerId, title, venue, capacity, startAt }) {
  return Event.create({ organizerId, title, venue, capacity, startAt });
}

async function listEvents({ upcomingOnly } = {}) {
  const filter = upcomingOnly ? { startAt: { $gte: new Date() } } : {};
  return Event.find(filter).sort({ startAt: 1 });
}

async function getEvent(id) {
  const event = await Event.findById(id);
  if (!event) {
    throw createError('Event not found', 404);
  }
  return event;
}

async function updateEvent(id, organizerId, patch) {
  const event = await getEvent(id);
  if (event.organizerId.toString() !== organizerId.toString()) {
    throw createError('Only the event organizer can edit this event', 403);
  }

  const editableFields = ['title', 'venue', 'capacity', 'startAt'];
  for (const field of editableFields) {
    if (Object.prototype.hasOwnProperty.call(patch, field)) {
      event[field] = patch[field];
    }
  }

  return event.save();
}

async function cancelEvent(id, organizerId) {
  const event = await getEvent(id);
  if (event.organizerId.toString() !== organizerId.toString()) {
    throw createError('Only the event organizer can cancel this event', 403);
  }

  event.cancelled = true;
  return event.save();
}

module.exports = { createEvent, listEvents, getEvent, updateEvent, cancelEvent };
