class Notifier {
  // Strategies let registration switch notification channels without changing registration logic.
  // An if/else chain in the service was rejected because it violates the Open/Closed Principle.
  async send(to, msg) {
    throw new Error('Not implemented');
  }
}

module.exports = Notifier;
