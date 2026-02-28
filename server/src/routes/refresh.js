const express = require('express');
const router = express.Router();
const { runRefresh, isRefreshing } = require('../services/refreshService');

// POST /api/refresh - trigger a data refresh and wait for completion
router.post('/', async (req, res) => {
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
    console.error('[POST /api/refresh] Refresh failed:', err);
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
