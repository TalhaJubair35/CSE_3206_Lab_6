const Registration = require('../models/Registration');

async function attendanceReport(eventId) {
  const registrations = await Registration.find({ eventId }).lean();
  return registrations.map(({ userId, status }) => ({
    user_id: userId,
    status
  }));
}

module.exports = { attendanceReport };
