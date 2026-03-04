const express = require('express');
const router = express.Router();
const { runFetch, runEnrich, runRefresh, isRefreshing, isEnriching } = require('../services/refreshService');

// GET /api/refresh - Vercel Cron 6:00 UTC: fetch only
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

// GET /api/refresh/enrich - Vercel Cron 6:30 UTC: Claude enrichment only
router.get('/enrich', async (req, res) => {
  if (isEnriching()) {
    return res.status(409).json({ success: false, message: 'Enrich already in progress' });
  }
  try {
    const result = await runEnrich();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[GET /api/refresh/enrich] Failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/refresh - manual trigger: fetch + enrich in sequence
router.post('/', async (req, res) => {
  if (isRefreshing()) {
    return res.status(409).json({ success: false, message: 'Refresh already in progress' });
  }
  try {
    const result = await runRefresh();
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
    isEnriching: isEnriching(),
  });
});

module.exports = router;
