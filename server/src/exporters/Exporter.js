class Exporter {
  // Adapters allow new output formats without changing report logic.
  // Hardcoding CSV in reportService was rejected because it couples reporting to one format.
  export(rows) {
    throw new Error('Not implemented');
  }
}

module.exports = Exporter;
