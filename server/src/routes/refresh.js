const express = require('express');
const router = express.Router();
const { runRefresh, isRefreshing } = require('../services/refreshService');

// POST /api/refresh - manually trigger a data refresh
router.post('/', async (req, res) => {
  if (isRefreshing()) {
    return res.status(409).json({
      success: false,
      message: 'Refresh already in progress',
    });
  }

  // Respond immediately and run refresh in background
  res.json({
    success: true,
    message: 'Refresh started. Data will be available shortly.',
  });

  // Run refresh asynchronously
  runRefresh().catch((err) => {
    console.error('[POST /api/refresh] Refresh failed:', err);
  });
});

// GET /api/refresh/status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    isRefreshing: isRefreshing(),
  });
});

module.exports = router;
