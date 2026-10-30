const mongoose = require('mongoose');

// Singleton keeps one shared MongoDB connection for the entire server process.
// Per-request connections were rejected because they waste resources and increase connection overhead.
class Database {
  async connect(uri = process.env.MONGO_URI || 'mongodb://localhost:27017/campusevents') {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    await mongoose.connect(uri);
    return mongoose.connection;
  }
}

module.exports = new Database();
