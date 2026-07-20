const { app, connectDatabase } = require('../server');

connectDatabase().catch((error) => {
  console.error('Database connection failed', error);
});

module.exports = app;
