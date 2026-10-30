const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const EmailNotifier = require('./notifier/EmailNotifier');

class AlreadyRegistered extends Error {
  constructor() {
    super('User is already registered for this event');
    this.name = 'AlreadyRegistered';
    this.status = 409;
  }
}

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function register({ user, event, notifier = new EmailNotifier() }) {
  const userId = user._id;
  const eventId = event._id;
  const existing = await Registration.findOne({ userId, eventId });

  if (existing && ['confirmed', 'waitlisted'].includes(existing.status)) {
    throw new AlreadyRegistered();
  }

  const confirmedCount = await Registration.countDocuments({
    eventId,
    status: 'confirmed'
  });
  const status = confirmedCount < event.capacity ? 'confirmed' : 'waitlisted';

  let registration;
  if (existing) {
    existing.status = status;
    existing.createdAt = new Date();
    registration = await existing.save();
  } else {
    try {
      registration = await Registration.create({ userId, eventId, status });
    } catch (error) {
      if (error.code === 11000) {
        throw new AlreadyRegistered();
      }
      throw error;
    }
  }

  const message = status === 'confirmed'
    ? `Your registration for ${event.title} is confirmed.`
    : `You have been added to the waitlist for ${event.title}.`;
  await notifier.send(user.email, message);

  return registration;
}

async function registerForEvent({ userId, eventId, notifier = new EmailNotifier() }) {
  const [user, event] = await Promise.all([
    User.findById(userId),
    Event.findById(eventId)
  ]);

  if (!user) {
    throw createError('User not found', 404);
  }
  if (!event) {
    throw createError('Event not found', 404);
  }

  return register({ user, event, notifier });
}

async function cancel({ user, eventId }) {
  const userId = user._id || user.id;
  const registration = await Registration.findOne({
    userId,
    eventId,
    status: 'confirmed'
  });

  if (!registration) {
    return false;
  }

  registration.status = 'cancelled';
  await registration.save();

  const nextInLine = await Registration.findOne({
    eventId,
    status: 'waitlisted'
  }).sort({ createdAt: 1 });

  if (nextInLine) {
    nextInLine.status = 'confirmed';
    await nextInLine.save();
  }

  return true;
}

module.exports = { register, registerForEvent, cancel, AlreadyRegistered };
