# CampusEvents

## Modules

Authentication, event management, registrations, and reporting.

## Setup

1. Copy `server/.env.example` to `server/.env`. Replace the MongoDB URI with the rotated Atlas credential. Configure Firebase Admin with a service account file kept outside version control.
2. The supplied Firebase Web App config is in the ignored local `client/.env`. For a fresh clone, copy `client/.env.example` to `client/.env` and fill in the values from Firebase Console.
3. Enable Email/Password in Firebase Authentication. Start MongoDB access, then run `npm install && npm run dev` from `server`.
4. In a second terminal, run `npm install && npm run dev` from `client`.

## Tests

Run the test suites with `npm test` from the project root.

## CI

GitHub Actions workflow: `.github/workflows/ci.yml`.

## Design Patterns

The design will use Singleton, Strategy, and Adapter patterns.

## AI Assistance

Document AI assistance and contributions here.
