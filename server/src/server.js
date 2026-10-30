require('dotenv').config();

const app = require('./app');
const db = require('./config/db');

const port = process.env.PORT || 4000;

async function startServer() {
  if (!process.env.MONGO_URI || /<[^>]+>/.test(process.env.MONGO_URI)) {
    throw new Error(
      'MONGO_URI is not configured. Copy server/.env.example to server/.env and set MONGO_URI to your rotated MongoDB Atlas URI.'
    );
  }

  await db.connect();
  app.listen(port, () => {
    console.log(`CampusEvents API listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start CampusEvents API:', error);
  process.exitCode = 1;
});
