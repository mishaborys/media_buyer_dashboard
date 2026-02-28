const { fetchAllNews } = require('./newsAggregator');
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
    // Fetch only Google News RSS (parallel), no Claude enrichment for now
    const items = await fetchAllNews();

    await db.saveNewsItems(items);
    await db.cleanOldNews();
    await db.logRefreshComplete(logId, items.length);

    console.log(`[Refresh] Completed. Saved ${items.length} raw items.`);
    return { success: true, itemsCount: items.length };
  } catch (err) {
    console.error('[Refresh] Error:', err);
    await db.logRefreshComplete(logId, 0, err.message);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

module.exports = { runRefresh, isRefreshing: () => isRefreshing };
