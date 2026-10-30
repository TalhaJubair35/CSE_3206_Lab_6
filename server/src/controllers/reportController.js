const { attendanceReport } = require('../services/reportService');
const CsvExporter = require('../exporters/CsvExporter');

const csvExporter = new CsvExporter();

async function getAttendance(req, res) {
  try {
    const rows = await attendanceReport(req.params.eventId);

    if (req.query.format === 'csv') {
      return res.type('text/csv').send(csvExporter.export(rows));
    }

    return res.status(200).json(rows);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}

module.exports = { getAttendance };
