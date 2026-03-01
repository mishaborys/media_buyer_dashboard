const { sql, db: pgDb } = require('@vercel/postgres');

async function initSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS news_items (
      id TEXT PRIMARY KEY,
      headline TEXT NOT NULL,
      url TEXT,
      source TEXT,
      source_type TEXT,
      market TEXT NOT NULL,
      category TEXT,
      summary TEXT,
      campaign_angle TEXT,
      published_at TIMESTAMPTZ,
      fetched_at TIMESTAMPTZ NOT NULL,
      raw_content TEXT
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS refresh_log (
      id SERIAL PRIMARY KEY,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      status TEXT,
      items_fetched INTEGER DEFAULT 0,
      error_message TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_news_market ON news_items(market)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_news_category ON news_items(category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_news_fetched ON news_items(fetched_at)`;
}

// Run schema init once per cold start
let schemaReady = false;
async function ensureSchema() {
  if (!schemaReady) {
    await initSchema();
    schemaReady = true;
  }
}

async function saveNewsItems(items) {
  await ensureSchema();
  for (const item of items) {
    await sql`
      INSERT INTO news_items
        (id, headline, url, source, source_type, market, category, summary, campaign_angle, published_at, fetched_at, raw_content)
      VALUES
        (${item.id}, ${item.headline}, ${item.url}, ${item.source}, ${item.source_type},
         ${item.market}, ${item.category}, ${item.summary}, ${item.campaign_angle},
         ${item.published_at}, ${item.fetched_at}, ${item.raw_content})
      ON CONFLICT (id) DO UPDATE SET
        summary = COALESCE(news_items.summary, EXCLUDED.summary),
        campaign_angle = COALESCE(news_items.campaign_angle, EXCLUDED.campaign_angle),
        fetched_at = EXCLUDED.fetched_at
    `;
  }
}

async function getNewsItems({ market, category, source_type, limit = 50, offset = 0 } = {}) {
  await ensureSchema();

  const conditions = [
    `fetched_at >= NOW() - INTERVAL '72 hours'`,
    `(published_at IS NULL OR published_at >= NOW() - INTERVAL '72 hours')`,
  ];
  const values = [];

  if (market && market !== 'ALL') {
    values.push(market);
    conditions.push(`market = $${values.length}`);
  }
  if (category && category !== 'ALL') {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }
  if (source_type && source_type !== 'ALL') {
    values.push(source_type);
    conditions.push(`source_type = $${values.length}`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  values.push(parseInt(limit), parseInt(offset));
  const limitIdx = values.length - 1;
  const offsetIdx = values.length;

  const result = await pgDb.query(
    `SELECT * FROM news_items ${where} ORDER BY fetched_at DESC, published_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    values
  );

  return result.rows;
}

// Extract trending keywords from today's headlines per market
async function getSocialTrends({ market } = {}) {
  await ensureSchema();

  let result;
  if (market && market !== 'ALL') {
    result = await sql`
      SELECT headline, market, category FROM news_items
      WHERE market = ${market}
        AND fetched_at >= NOW() - INTERVAL '25 hours'
    `;
  } else {
    result = await sql`
      SELECT headline, market, category FROM news_items
      WHERE fetched_at >= NOW() - INTERVAL '25 hours'
    `;
  }

  return extractTrends(result.rows);
}

// Extract meaningful keywords from headlines, group by market
function extractTrends(newsRows) {
  const STOP_WORDS = new Set([
    'the','a','an','in','on','at','to','for','of','and','or','but','is','are',
    'was','were','be','been','being','have','has','had','do','does','did',
    'will','would','could','should','may','might','shall','can','not','with',
    'this','that','these','those','from','by','as','up','out','about','into',
    'than','then','when','how','what','which','who','new','says','after',
    'over','more','also','just','its','their','your','our','his','her','we',
  ]);

  const marketKeywords = {};

  for (const row of newsRows) {
    if (!marketKeywords[row.market]) marketKeywords[row.market] = {};
    const counts = marketKeywords[row.market];

    const words = row.headline
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    for (const word of words) {
      counts[word] = (counts[word] || 0) + 1;
    }
  }

  const trends = [];
  for (const [market, counts] of Object.entries(marketKeywords)) {
    const topKeywords = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => ({
        topic: word.charAt(0).toUpperCase() + word.slice(1),
        url: `https://news.google.com/search?q=${encodeURIComponent(word)}`,
      }));

    if (topKeywords.length > 0) {
      trends.push({ platform: 'Trending', market, topics: topKeywords });
    }
  }

  return trends;
}

async function getLastRefresh() {
  await ensureSchema();
  const result = await sql`
    SELECT * FROM refresh_log ORDER BY id DESC LIMIT 1
  `;
  return result.rows[0] || null;
}

async function logRefreshStart() {
  await ensureSchema();
  const result = await sql`
    INSERT INTO refresh_log (started_at, status) VALUES (NOW(), 'running') RETURNING id
  `;
  return result.rows[0].id;
}

async function logRefreshComplete(id, itemsFetched, error = null) {
  await sql`
    UPDATE refresh_log
    SET completed_at = NOW(),
        status = ${error ? 'error' : 'success'},
        items_fetched = ${itemsFetched},
        error_message = ${error}
    WHERE id = ${id}
  `;
}

async function getUnenrichedItems(limit = 50) {
  await ensureSchema();
  const result = await sql`
    SELECT * FROM news_items
    WHERE summary IS NULL
    ORDER BY fetched_at DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

async function cleanOldNews() {
  await sql`
    DELETE FROM news_items WHERE fetched_at < NOW() - INTERVAL '72 hours'
  `;
}

async function getNewsItemById(id) {
  await ensureSchema();
  const result = await sql`SELECT * FROM news_items WHERE id = ${id} LIMIT 1`;
  return result.rows[0] || null;
}

async function updateNewsItemEnrichment(id, summary, campaign_angle) {
  await sql`
    UPDATE news_items
    SET summary = ${summary}, campaign_angle = ${campaign_angle}
    WHERE id = ${id}
  `;
}

module.exports = {
  saveNewsItems,
  getNewsItems,
  getNewsItemById,
  updateNewsItemEnrichment,
  getUnenrichedItems,
  getSocialTrends,
  getLastRefresh,
  logRefreshStart,
  logRefreshComplete,
  cleanOldNews,
};
