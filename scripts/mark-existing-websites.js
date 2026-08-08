// One-time backfill: mark every current websiteClients record as
// hasExistingWebsite = true. Run this once after deploying the
// hasExistingWebsite field, so records created before that field existed
// don't default to "we built this site" (which would be wrong for most of
// them) until someone reviews and flips the ones we actually built.
//
// Usage: MONGO_URI="..." node scripts/mark-existing-websites.js
// (or ENIGMA_MONGODB_URI / REACT_APP_MONGO_URI, same as server.js)

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || process.env.ENIGMA_MONGODB_URI || process.env.REACT_APP_MONGO_URI;

if (!mongoUri) {
  console.error('No Mongo connection string found (MONGO_URI / ENIGMA_MONGODB_URI / REACT_APP_MONGO_URI).');
  process.exit(1);
}

async function run() {
  await mongoose.connect(mongoUri, { dbName: 'enigma' });
  console.log('Connected.');

  const result = await mongoose.connection.collection('websiteClients').updateMany(
    {},
    { $set: { hasExistingWebsite: true } }
  );

  console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount} website client(s).`);

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
