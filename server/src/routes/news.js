const express = require('express');
const router = express.Router();
const db = require('../services/database');

// GET /api/news
// Query params: market (USA|EU|LATAM|Canada|ALL), category (Tech|eCommerce|Finance|Auto|Savings & Benefits|ALL), limit, offset
router.get('/', (req, res) => {
  try {
    const { market, category, limit = 50, offset = 0 } = req.query;

    const items = db.getNewsItems({
      market: market || 'ALL',
      category: category || 'ALL',
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const lastRefresh = db.getLastRefresh();

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
// Query params: market
router.get('/social', (req, res) => {
  try {
    const { market } = req.query;

    const trends = db.getSocialTrends({ market: market || 'ALL' });

    // Group by platform and market
    const grouped = {};
    for (const trend of trends) {
      const key = `${trend.market}_${trend.platform}`;
      if (!grouped[key]) {
        grouped[key] = {
          platform: trend.platform,
          market: trend.market,
          topics: [],
        };
      }
      grouped[key].topics.push({ topic: trend.topic, url: trend.url });
    }

    res.json({
      success: true,
      data: Object.values(grouped),
    });
  } catch (err) {
    console.error('[GET /api/news/social] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch social trends' });
  }
});

// GET /api/news/status
router.get('/status', (req, res) => {
  try {
    const lastRefresh = db.getLastRefresh();
    res.json({
      success: true,
      lastRefresh,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

module.exports = router;
