jest.mock('../src/models/Event', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn()
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const Event = require('../src/models/Event');
const app = require('../src/app');
const eventService = require('../src/services/eventService');

describe('events', () => {
  const secret = 'event-test-secret';
  const ownerId = '507f1f77bcf86cd799439011';
  const otherId = '507f1f77bcf86cd799439012';
  const eventId = '507f1f77bcf86cd799439013';

  beforeAll(() => {
    process.env.JWT_SECRET = secret;
  });

  beforeEach(() => {
    Event.create.mockReset();
    Event.find.mockReset();
    Event.findById.mockReset();
  });

  function token(id = ownerId, role = 'organizer') {
    return jwt.sign({ id, role }, secret);
  }

  function ownedEvent() {
    return {
      _id: eventId,
      organizerId: { toString: () => ownerId },
      title: 'Campus Event',
      cancelled: false,
      save: jest.fn().mockImplementation(function () { return this; })
    };
  }

  test('lists events publicly and accepts upcomingOnly query', async () => {
    const sort = jest.fn().mockResolvedValue([{ title: 'Upcoming' }]);
    Event.find.mockReturnValue({ sort });

    const response = await request(app).get('/api/events?upcomingOnly=true');

    expect(response.status).toBe(200);
    expect(response.body.events).toEqual([{ title: 'Upcoming' }]);
    expect(Event.find).toHaveBeenCalledWith({
      startAt: { $gte: expect.any(Date) }
    });
    expect(sort).toHaveBeenCalledWith({ startAt: 1 });
  });

  test('gets an event publicly and returns 404 when missing', async () => {
    Event.findById.mockResolvedValueOnce({ _id: eventId }).mockResolvedValueOnce(null);

    const found = await request(app).get(`/api/events/${eventId}`);
    const missing = await request(app).get(`/api/events/${eventId}`);

    expect(found.status).toBe(200);
    expect(found.body.event._id).toBe(eventId);
    expect(missing.status).toBe(404);
  });

  test('requires an organizer or admin role to create events', async () => {
    const unauthorized = await request(app).post('/api/events').send({ title: 'Event' });
    const student = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token(ownerId, 'student')}`)
      .send({ title: 'Event' });
    const event = { _id: eventId, title: 'Event', organizerId: ownerId };
    Event.create.mockResolvedValue(event);
    const created = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token()}`)
      .send({ title: 'Event' });

    expect(unauthorized.status).toBe(401);
    expect(student.status).toBe(403);
    expect(created.status).toBe(201);
    expect(Event.create).toHaveBeenCalledWith({
      title: 'Event',
      organizerId: ownerId
    });
  });

  test('updates only editable fields for the owning organizer', async () => {
    const event = ownedEvent();
    Event.findById.mockResolvedValue(event);

    const response = await request(app)
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token()}`)
      .send({ title: 'Updated', organizerId: otherId, cancelled: true });

    expect(response.status).toBe(200);
    expect(event.title).toBe('Updated');
    expect(event.organizerId.toString()).toBe(ownerId);
    expect(event.cancelled).toBe(false);
    expect(event.save).toHaveBeenCalledTimes(1);
  });

  test('prevents a different organizer from updating or cancelling', async () => {
    Event.findById.mockResolvedValue(ownedEvent());

    const update = await request(app)
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token(otherId)}`)
      .send({ title: 'Unauthorized edit' });
    const cancel = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token(otherId)}`);

    expect(update.status).toBe(403);
    expect(cancel.status).toBe(403);
  });

  test('cancels the event for its organizer', async () => {
    const event = ownedEvent();
    Event.findById.mockResolvedValue(event);

    const response = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token()}`);

    expect(response.status).toBe(200);
    expect(event.cancelled).toBe(true);
    expect(event.save).toHaveBeenCalledTimes(1);
  });

  test('event service reports a missing event with status 404', async () => {
    Event.findById.mockResolvedValue(null);

    await expect(eventService.getEvent(eventId)).rejects.toMatchObject({ status: 404 });
  });
});
