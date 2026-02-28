// Local development entry point — starts Express with HTTP server + cron
const app = require('./app');
const cron = require('node-cron');
const { runRefresh } = require('./services/refreshService');

const PORT = process.env.PORT || 3001;

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

async function startupRefresh() {
  const db = require('./services/database');
  const lastRefresh = await db.getLastRefresh();
  if (!lastRefresh) {
    console.log('[Startup] No data found, running initial refresh...');
    runRefresh().catch((err) => console.error('[Startup] Initial refresh failed:', err.message));
  } else {
    const hoursSince = (Date.now() - new Date(lastRefresh.completed_at).getTime()) / 3600000;
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
