const {
  applicationDefault,
  cert,
  getApps,
  initializeApp
} = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function getFirebaseAuth() {
  let app = getApps()[0];

  if (!app) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const serializedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serializedServiceAccount) {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serializedServiceAccount);
      } catch (error) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON');
      }

      app = initializeApp({
        credential: cert(serviceAccount),
        ...(projectId ? { projectId } : {})
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      app = initializeApp({
        credential: applicationDefault(),
        ...(projectId ? { projectId } : {})
      });
    } else {
      throw new Error(
        'Configure FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS for Firebase Admin'
      );
    }
  }

  return getAuth(app);
}

module.exports = { getFirebaseAuth };
