require('dotenv').config();

const app = require('./app');
const db = require('./config/db');

const port = process.env.PORT || 4000;

async function startServer() {
  await db.connect();
  app.listen(port, () => {
    console.log(`CampusEvents API listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start CampusEvents API:', error);
  process.exitCode = 1;
});
