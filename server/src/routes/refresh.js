const express = require('express');
const router = express.Router();
const { runFetch, isRefreshing } = require('../services/refreshService');

// GET /api/refresh - Vercel Cron 8:00 UTC: fetch only
router.get('/', async (req, res) => {
  if (isRefreshing()) {
    return res.status(409).json({ success: false, message: 'Fetch already in progress' });
  }
  try {
    const result = await runFetch();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[GET /api/refresh] Failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/refresh - manual trigger (Refresh button): fetch only, no Claude enrichment
router.post('/', async (req, res) => {
  if (isRefreshing()) {
    return res.status(409).json({ success: false, message: 'Refresh already in progress' });
  }
  try {
    const result = await runFetch();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[POST /api/refresh] Failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/refresh/status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    isRefreshing: isRefreshing(),
  });
});

module.exports = router;
