require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');

const newsRouter = require('./routes/news');
const refreshRouter = require('./routes/refresh');
const { runRefresh } = require('./services/refreshService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Routes
app.use('/api/news', newsRouter);
app.use('/api/refresh', refreshRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Schedule daily refresh at 6:00 AM UTC
const cronSchedule = process.env.CRON_SCHEDULE || '0 6 * * *';
cron.schedule(cronSchedule, async () => {
  console.log('[Cron] Triggering scheduled refresh...');
  try {
    await runRefresh();
  } catch (err) {
    console.error('[Cron] Refresh failed:', err);
  }
}, { timezone: 'UTC' });

console.log(`[Cron] Scheduled daily refresh at: ${cronSchedule} UTC`);

// On startup, run an initial refresh if no data exists
async function startupRefresh() {
  const db = require('./services/database');
  const lastRefresh = db.getLastRefresh();

  if (!lastRefresh) {
    console.log('[Startup] No data found, running initial refresh...');
    try {
      await runRefresh();
    } catch (err) {
      console.error('[Startup] Initial refresh failed:', err.message);
    }
  } else {
    const lastTime = new Date(lastRefresh.completed_at);
    const hoursSince = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 24) {
      console.log(`[Startup] Data is ${hoursSince.toFixed(1)}h old, refreshing...`);
      runRefresh().catch(console.error);
    } else {
      console.log(`[Startup] Data is fresh (${hoursSince.toFixed(1)}h old), skipping refresh`);
    }
  }
}

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  startupRefresh();
});

module.exports = app;
