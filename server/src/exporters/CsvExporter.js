const Exporter = require('./Exporter');

class CsvExporter extends Exporter {
  export(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return '';
    }

    const headers = Object.keys(rows[0]);
    const escape = (value) => {
      const text = value == null ? '' : String(value);
      return /[",\r\n]/.test(text)
        ? `"${text.replace(/"/g, '""')}"`
        : text;
    };
    const lines = [
      headers.map(escape).join(','),
      ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))
    ];

    return lines.join('\n');
  }
}

module.exports = CsvExporter;
