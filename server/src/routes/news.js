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

// GET /api/news/social — returns Google Trends search queries grouped by market
router.get('/social', async (req, res) => {
  try {
    const { market } = req.query;
    const items = await db.getNewsItems({
      market: market || 'ALL',
      source_type: 'google_trends',
      limit: 100,
    });

    // Group by market, then by country within market
    // byMarket: { USA: { market, countries: { US: [{topic,url,traffic}] } } }
    const byMarket = {};
    for (const item of items) {
      if (!byMarket[item.market]) {
        byMarket[item.market] = { market: item.market, countries: {} };
      }
      // source field: "Google Trends (DE)" → extract geo code
      const geoMatch = item.source?.match(/\((\w+)\)$/);
      const geo = geoMatch?.[1] || 'XX';

      if (!byMarket[item.market].countries[geo]) {
        byMarket[item.market].countries[geo] = [];
      }

      const trafficMatch = item.raw_content?.match(/~([^s]+searches?)/i);
      const traffic = trafficMatch ? trafficMatch[1].trim() : null;

      byMarket[item.market].countries[geo].push({
        topic: item.headline.replace(/^🔥\s*/, ''),
        url: item.url,
        traffic,
      });
    }

    res.json({ success: true, data: Object.values(byMarket) });
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
