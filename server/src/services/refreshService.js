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
  const logId = await db.logRefreshStart();
  console.log(`[Refresh] Starting refresh cycle (log id: ${logId})`);

  try {
    const rawItems = await fetchAllNews();
    const enrichedItems = await enrichNewsItems(rawItems);

    await db.saveNewsItems(enrichedItems);

    const socialTrends = await fetchAllSocialTrends();
    await db.saveSocialTrends(socialTrends);

    await db.cleanOldNews();
    await db.logRefreshComplete(logId, enrichedItems.length);

    console.log(`[Refresh] Completed. Saved ${enrichedItems.length} items, ${socialTrends.length} social trends`);
    return { success: true, itemsCount: enrichedItems.length, trendsCount: socialTrends.length };
  } catch (err) {
    console.error('[Refresh] Error:', err);
    await db.logRefreshComplete(logId, 0, err.message);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

module.exports = { runRefresh, isRefreshing: () => isRefreshing };
