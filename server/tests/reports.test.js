jest.mock('../src/models/Registration', () => ({
  find: jest.fn()
}));

jest.mock('../src/models/User', () => ({
  findOne: jest.fn()
}));

jest.mock('../src/config/firebase', () => ({
  getFirebaseAuth: jest.fn()
}));

const Registration = require('../src/models/Registration');
const User = require('../src/models/User');
const { getFirebaseAuth } = require('../src/config/firebase');
const { attendanceReport } = require('../src/services/reportService');
const CsvExporter = require('../src/exporters/CsvExporter');
const app = require('../src/app');
const request = require('supertest');

describe('attendance report behavior', () => {
  beforeEach(() => {
    Registration.find.mockReset();
    User.findOne.mockResolvedValue({
      _id: { toString: () => 'admin-user' },
      firebaseUid: 'admin-user',
      email: 'admin@example.edu',
      role: 'admin'
    });
    getFirebaseAuth.mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: 'admin-user',
        email: 'admin@example.edu'
      })
    });
  });

  test('maps registration rows to user id and status', async () => {
    const rows = [
      { userId: 'user-1', status: 'confirmed' },
      { userId: 'user-2', status: 'waitlisted' }
    ];
    const lean = jest.fn().mockResolvedValue(rows);
    Registration.find.mockReturnValue({ lean });

    await expect(attendanceReport('event-1')).resolves.toEqual([
      { user_id: 'user-1', status: 'confirmed' },
      { user_id: 'user-2', status: 'waitlisted' }
    ]);
    expect(Registration.find).toHaveBeenCalledWith({ eventId: 'event-1' });
    expect(lean).toHaveBeenCalledTimes(1);
  });

  test('exports attendance rows with a header and matching CSV body', () => {
    const exporter = new CsvExporter();

    expect(exporter.export([
      { user_id: 'user-1', status: 'confirmed' },
      { user_id: 'user-2', status: 'waitlisted' }
    ])).toBe('user_id,status\nuser-1,confirmed\nuser-2,waitlisted');
  });

  test('returns an empty string when there are no attendance rows', () => {
    const exporter = new CsvExporter();

    expect(exporter.export([])).toBe('');
  });

  test('serves CSV attendance data to an authenticated admin', async () => {
    const lean = jest.fn().mockResolvedValue([
      { userId: 'user-1', status: 'confirmed' }
    ]);
    Registration.find.mockReturnValue({ lean });

    const response = await request(app)
      .get('/api/reports/attendance/event-1?format=csv')
      .set('Authorization', 'Bearer firebase-id-token');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/csv/);
    expect(response.text).toBe('user_id,status\nuser-1,confirmed');
  });

  test('serves JSON attendance data to an authenticated admin', async () => {
    const lean = jest.fn().mockResolvedValue([
      { userId: 'user-2', status: 'waitlisted' }
    ]);
    Registration.find.mockReturnValue({ lean });

    const response = await request(app)
      .get('/api/reports/attendance/event-2')
      .set('Authorization', 'Bearer firebase-id-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ user_id: 'user-2', status: 'waitlisted' }]);
  });

  test('denies attendance reports to a non-admin profile', async () => {
    User.findOne.mockResolvedValue({
      _id: { toString: () => 'organizer-user' },
      firebaseUid: 'organizer-user',
      email: 'organizer@example.edu',
      role: 'organizer'
    });

    const response = await request(app)
      .get('/api/reports/attendance/event-1')
      .set('Authorization', 'Bearer firebase-id-token');

    expect(response.status).toBe(403);
    expect(Registration.find).not.toHaveBeenCalled();
  });
});
