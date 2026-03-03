const express = require('express');
const router = express.Router();
const { runRefresh, isRefreshing } = require('../services/refreshService');

// Handler used by both GET (Vercel Cron) and POST (manual trigger)
async function handleRefresh(req, res) {
  if (isRefreshing()) {
    return res.status(409).json({
      success: false,
      message: 'Refresh already in progress',
    });
  }

  try {
    const result = await runRefresh();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[/api/refresh] Refresh failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/refresh - called by Vercel Cron Jobs (they make GET requests)
router.get('/', handleRefresh);

// POST /api/refresh - manual trigger from UI or scripts
router.post('/', handleRefresh);

// GET /api/refresh/status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    isRefreshing: isRefreshing(),
  });
});

module.exports = router;
