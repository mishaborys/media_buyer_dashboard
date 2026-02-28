/**
 * SQLite wrapper using sql.js (pure JS — works on any Node version, including Vercel).
 * DB is persisted to file and loaded into memory on first access.
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/news.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;
let SQL = null;

async function getDb() {
  if (db) return db;

  // Explicitly provide WASM path so sql.js finds it in any environment (Vercel, local)
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
  SQL = await initSqlJs({ locateFile: () => wasmPath });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initSchema();
  return db;
}

function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function initSchema() {
  db.run(`
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
      published_at TEXT,
      fetched_at TEXT NOT NULL,
      raw_content TEXT
    );

    CREATE TABLE IF NOT EXISTS social_trends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      market TEXT NOT NULL,
      topic TEXT NOT NULL,
      url TEXT,
      fetched_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS refresh_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT,
      items_fetched INTEGER DEFAULT 0,
      error_message TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_news_market ON news_items(market);
    CREATE INDEX IF NOT EXISTS idx_news_category ON news_items(category);
    CREATE INDEX IF NOT EXISTS idx_news_fetched ON news_items(fetched_at);
    CREATE INDEX IF NOT EXISTS idx_social_market ON social_trends(market);
  `);
  save();
}

// Helpers to convert sql.js result to array of objects
function toRows(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row) =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

function toRow(result) {
  const rows = toRows(result);
  return rows[0] || null;
}

// --- Public API (sync-style wrappers around the async db init) ---
// All functions return Promises; callers must await them.

async function saveNewsItems(items) {
  const db = await getDb();
  for (const item of items) {
    db.run(
      `INSERT OR REPLACE INTO news_items
        (id, headline, url, source, source_type, market, category, summary, campaign_angle, published_at, fetched_at, raw_content)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        item.id, item.headline, item.url, item.source, item.source_type,
        item.market, item.category, item.summary, item.campaign_angle,
        item.published_at, item.fetched_at, item.raw_content,
      ]
    );
  }
  save();
}

async function saveSocialTrends(trends) {
  const db = await getDb();
  db.run(`DELETE FROM social_trends WHERE fetched_at < datetime('now', '-2 hours')`);
  for (const t of trends) {
    db.run(
      `INSERT INTO social_trends (platform, market, topic, url, fetched_at) VALUES (?,?,?,?,?)`,
      [t.platform, t.market, t.topic, t.url, t.fetched_at]
    );
  }
  save();
}

async function getNewsItems({ market, category, limit = 50, offset = 0 } = {}) {
  const db = await getDb();
  let query = `SELECT * FROM news_items WHERE 1=1`;
  const params = [];

  if (market && market !== 'ALL') { query += ` AND market = ?`; params.push(market); }
  if (category && category !== 'ALL') { query += ` AND category = ?`; params.push(category); }

  query += ` ORDER BY fetched_at DESC, published_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return toRows(db.exec(query, params));
}

async function getSocialTrends({ market } = {}) {
  const db = await getDb();
  let query = `SELECT * FROM social_trends WHERE fetched_at >= datetime('now', '-25 hours')`;
  const params = [];

  if (market && market !== 'ALL') { query += ` AND market = ?`; params.push(market); }
  query += ` ORDER BY fetched_at DESC`;

  return toRows(db.exec(query, params));
}

async function getLastRefresh() {
  const db = await getDb();
  return toRow(db.exec(`SELECT * FROM refresh_log ORDER BY id DESC LIMIT 1`));
}

async function logRefreshStart() {
  const db = await getDb();
  db.run(`INSERT INTO refresh_log (started_at, status) VALUES (datetime('now'), 'running')`);
  const row = toRow(db.exec(`SELECT last_insert_rowid() as id`));
  save();
  return row?.id;
}

async function logRefreshComplete(id, itemsFetched, error = null) {
  const db = await getDb();
  db.run(
    `UPDATE refresh_log SET completed_at = datetime('now'), status = ?, items_fetched = ?, error_message = ? WHERE id = ?`,
    [error ? 'error' : 'success', itemsFetched, error, id]
  );
  save();
}

async function cleanOldNews() {
  const db = await getDb();
  db.run(`DELETE FROM news_items WHERE fetched_at < datetime('now', '-48 hours')`);
  save();
}

module.exports = {
  getDb,
  saveNewsItems,
  saveSocialTrends,
  getNewsItems,
  getSocialTrends,
  getLastRefresh,
  logRefreshStart,
  logRefreshComplete,
  cleanOldNews,
};
