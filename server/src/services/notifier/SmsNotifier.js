const Notifier = require('./Notifier');

class SmsNotifier extends Notifier {
  async send(to, msg) {
    // A real implementation would use Twilio; this console mock is suitable for tests.
    console.log(`SMS to ${to}: ${msg}`);
    return true;
  }
}

module.exports = SmsNotifier;
