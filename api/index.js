// Vercel serverless entry point
// Loads .env from root if present (for local `vercel dev`)
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = require('../server/src/app');
