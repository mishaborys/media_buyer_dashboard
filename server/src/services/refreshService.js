const { fetchAllNews } = require('./newsAggregator');
const { fetchAllSocialTrends } = require('./socialScraper');
const { enrichNewsItems } = require('./claudeService');
const db = require('./database');

let isRefreshing = false;

async function runRefresh() {
  if (isRefreshing) {
    console.log('[Refresh] Already running, skipping...');
    return { skipped: true };
  }

  isRefreshing = true;
  const logId = db.logRefreshStart();
  console.log(`[Refresh] Starting refresh cycle (log id: ${logId})`);

  try {
    // 1. Fetch news from all sources
    const rawItems = await fetchAllNews();

    // 2. Enrich with Claude summaries and campaign angles
    const enrichedItems = await enrichNewsItems(rawItems);

    // 3. Save to database
    db.saveNewsItems(enrichedItems);

    // 4. Fetch and save social trends
    const socialTrends = await fetchAllSocialTrends();
    db.saveSocialTrends(socialTrends);

    // 5. Clean up old data
    db.cleanOldNews();

    db.logRefreshComplete(logId, enrichedItems.length);
    console.log(`[Refresh] Completed. Saved ${enrichedItems.length} news items, ${socialTrends.length} social trends`);

    return { success: true, itemsCount: enrichedItems.length, trendsCount: socialTrends.length };
  } catch (err) {
    console.error('[Refresh] Error during refresh:', err);
    db.logRefreshComplete(logId, 0, err.message);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

module.exports = { runRefresh, isRefreshing: () => isRefreshing };
