const Notifier = require('./Notifier');

class EmailNotifier extends Notifier {
  async send(to, msg) {
    // A real implementation would use nodemailer; this console mock is suitable for tests.
    console.log(`Email to ${to}: ${msg}`);
    return true;
  }
}

module.exports = EmailNotifier;
