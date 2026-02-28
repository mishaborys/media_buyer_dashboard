const { fetchAllNews } = require('./newsAggregator');
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
    // Fetch Google News RSS + Reddit in parallel
    const items = await fetchAllNews();

    // Enrich top 30 new items with Claude (Ukrainian summaries + campaign angles)
    const toEnrich = items.slice(0, 30);
    const rest = items.slice(30);
    const enriched = await enrichNewsItems(toEnrich);

    const allItems = [...enriched, ...rest];
    await db.saveNewsItems(allItems);
    await db.cleanOldNews();
    await db.logRefreshComplete(logId, allItems.length);

    console.log(`[Refresh] Completed. Saved ${allItems.length} items (${enriched.length} enriched by Claude).`);
    return { success: true, itemsCount: allItems.length };
  } catch (err) {
    console.error('[Refresh] Error:', err);
    await db.logRefreshComplete(logId, 0, err.message);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

module.exports = { runRefresh, isRefreshing: () => isRefreshing };
