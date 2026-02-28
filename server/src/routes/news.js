const express = require('express');
const router = express.Router();
const db = require('../services/database');

// GET /api/news
router.get('/', async (req, res) => {
  try {
    const { market, category, limit = 50, offset = 0 } = req.query;

    const [items, lastRefresh] = await Promise.all([
      db.getNewsItems({
        market: market || 'ALL',
        category: category || 'ALL',
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
    const trends = await db.getSocialTrends({ market: market || 'ALL' });

    const grouped = {};
    for (const trend of trends) {
      const key = `${trend.market}_${trend.platform}`;
      if (!grouped[key]) {
        grouped[key] = { platform: trend.platform, market: trend.market, topics: [] };
      }
      grouped[key].topics.push({ topic: trend.topic, url: trend.url });
    }

    res.json({ success: true, data: Object.values(grouped) });
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
