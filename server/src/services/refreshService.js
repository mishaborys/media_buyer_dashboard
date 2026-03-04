const { fetchAllNews } = require('./newsAggregator');
const { enrichNewsItems } = require('./claudeService');
const db = require('./database');

let isRefreshing = false;
let isEnriching = false;

// Phase 1: fetch all sources, save to DB, clean old news (~20-25s)
async function runFetch() {
  if (isRefreshing) {
    console.log('[Refresh] Already running, skipping...');
    return { skipped: true };
  }

  isRefreshing = true;
  const logId = await db.logRefreshStart();
  console.log(`[Refresh] Starting fetch cycle (log id: ${logId})`);

  try {
    const items = await fetchAllNews();
    await db.saveNewsItems(items);
    await db.cleanOldNews();
    await db.logRefreshComplete(logId, items.length);
    console.log(`[Refresh] Fetch completed. ${items.length} items saved.`);
    return { success: true, itemsCount: items.length };
  } catch (err) {
    console.error('[Refresh] Fetch error:', err);
    await db.logRefreshComplete(logId, 0, err.message);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

// Phase 2: Claude enrichment only, up to 15 items (~15-20s)
async function runEnrich() {
  if (isEnriching) {
    console.log('[Enrich] Already running, skipping...');
    return { skipped: true };
  }

  isEnriching = true;
  console.log('[Enrich] Starting enrich cycle...');

  try {
    const unenriched = await db.getUnenrichedItems(15);
    if (unenriched.length === 0) {
      console.log('[Enrich] Nothing to enrich.');
      return { success: true, enrichedCount: 0 };
    }
    console.log(`[Enrich] Enriching ${unenriched.length} items with Claude...`);
    const enriched = await enrichNewsItems(unenriched);
    await db.saveNewsItems(enriched);
    console.log(`[Enrich] Done. ${enriched.length} items enriched.`);
    return { success: true, enrichedCount: enriched.length };
  } catch (err) {
    console.error('[Enrich] Error:', err);
    throw err;
  } finally {
    isEnriching = false;
  }
}

// Manual trigger: fetch + enrich in sequence
async function runRefresh() {
  const fetchResult = await runFetch();
  if (fetchResult.skipped) return fetchResult;
  const enrichResult = await runEnrich();
  return { ...fetchResult, ...enrichResult };
}

module.exports = {
  runFetch,
  runEnrich,
  runRefresh,
  isRefreshing: () => isRefreshing,
  isEnriching: () => isEnriching,
};
