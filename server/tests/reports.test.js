jest.mock('../src/models/Registration', () => ({
  find: jest.fn()
}));

const Registration = require('../src/models/Registration');
const { attendanceReport } = require('../src/services/reportService');
const CsvExporter = require('../src/exporters/CsvExporter');

describe('attendance report behavior', () => {
  beforeEach(() => {
    Registration.find.mockReset();
  });

  test('maps registration rows to attendee email, event title, and status', async () => {
    Registration.find.mockResolvedValue([
      {
        userId: { email: 'one@example.edu' },
        eventId: { title: 'Campus Fair' },
        status: 'confirmed'
      },
      {
        userId: { email: 'two@example.edu' },
        eventId: { title: 'Campus Fair' },
        status: 'waitlisted'
      }
    ]);

    await expect(attendanceReport('event-1')).resolves.toEqual([
      {
        email: 'one@example.edu',
        eventTitle: 'Campus Fair',
        status: 'confirmed'
      },
      {
        email: 'two@example.edu',
        eventTitle: 'Campus Fair',
        status: 'waitlisted'
      }
    ]);
    expect(Registration.find).toHaveBeenCalledWith({ eventId: 'event-1' });
  });

  test('exports attendance rows with a header and matching CSV body', () => {
    const exporter = new CsvExporter();

    expect(exporter.export([
      {
        email: 'one@example.edu',
        eventTitle: 'Campus Fair',
        status: 'confirmed'
      },
      {
        email: 'two@example.edu',
        eventTitle: 'Campus Fair',
        status: 'waitlisted'
      }
    ])).toBe(
      'email,eventTitle,status\n' +
      'one@example.edu,Campus Fair,confirmed\n' +
      'two@example.edu,Campus Fair,waitlisted'
    );
  });

  test('returns an empty string when there are no attendance rows', () => {
    const exporter = new CsvExporter();

    expect(exporter.export([])).toBe('');
  });
});
