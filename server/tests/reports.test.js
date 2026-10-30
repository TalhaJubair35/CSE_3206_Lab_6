jest.mock('../src/models/Registration', () => ({
  find: jest.fn()
}));

const Registration = require('../src/models/Registration');
const { attendanceReport } = require('../src/services/reportService');
const CsvExporter = require('../src/exporters/CsvExporter');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const request = require('supertest');

describe('attendance report behavior', () => {
  beforeEach(() => {
    Registration.find.mockReset();
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
    ])).toBe(
      'user_id,status\n' +
      'user-1,confirmed\n' +
      'user-2,waitlisted'
    );
  });

  test('returns an empty string when there are no attendance rows', () => {
    const exporter = new CsvExporter();

    expect(exporter.export([])).toBe('');
  });

  test('serves CSV attendance data only to an authenticated admin', async () => {
    const lean = jest.fn().mockResolvedValue([
      { userId: 'user-1', status: 'confirmed' }
    ]);
    Registration.find.mockReturnValue({ lean });
    process.env.JWT_SECRET = 'report-test-secret';
    const token = jwt.sign(
      { id: 'admin-1', role: 'admin' },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .get('/api/reports/attendance/event-1?format=csv')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/csv/);
    expect(response.text).toBe('user_id,status\nuser-1,confirmed');
  });
});
