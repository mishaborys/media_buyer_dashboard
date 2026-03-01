const express = require('express');
const router = express.Router();
const db = require('../services/database');

// GET /api/news
router.get('/', async (req, res) => {
  try {
    const { market, category, source_type, limit = 50, offset = 0 } = req.query;

    const [items, lastRefresh] = await Promise.all([
      db.getNewsItems({
        market: market || 'ALL',
        category: category || 'ALL',
        source_type: source_type || 'ALL',
        limit: parseInt(limit),
        offset: parseInt(offset),
      }),
      db.getLastRefresh(),
    ]);

    res.json({
      success: true,
      data: items,
      meta: {
        count: items.length,
        lastRefresh: lastRefresh?.completed_at || null,
        filters: { market, category },
      },
    });
  } catch (err) {
    console.error('[GET /api/news] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

// GET /api/news/social
router.get('/social', async (req, res) => {
  try {
    const { market } = req.query;
    // getSocialTrends already returns grouped [{platform, market, topics:[]}]
    const trends = await db.getSocialTrends({ market: market || 'ALL' });
    res.json({ success: true, data: trends });
  } catch (err) {
    console.error('[GET /api/news/social] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch social trends' });
  }
});

// GET /api/news/status
router.get('/status', async (req, res) => {
  try {
    const lastRefresh = await db.getLastRefresh();
    res.json({ success: true, lastRefresh });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

module.exports = router;
