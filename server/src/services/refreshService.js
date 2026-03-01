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
    // Fetch all sources in parallel
    const items = await fetchAllNews();

    // Save all raw items first (COALESCE preserves existing summaries in DB)
    await db.saveNewsItems(items);
    await db.cleanOldNews();

    // Enrich items that don't have summaries yet (up to 50 per refresh to stay within timeout)
    const unenriched = await db.getUnenrichedItems(20);
    if (unenriched.length > 0) {
      console.log(`[Refresh] Enriching ${unenriched.length} items with Claude...`);
      const enriched = await enrichNewsItems(unenriched);
      await db.saveNewsItems(enriched);
    }

    await db.logRefreshComplete(logId, items.length);
    console.log(`[Refresh] Completed. ${items.length} items total, ${unenriched.length} enriched by Claude.`);
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
