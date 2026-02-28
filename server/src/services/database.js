const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/news.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL;');
    initSchema(db);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_social_fetched ON social_trends(fetched_at);
  `);
}

function saveNewsItems(items) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO news_items
      (id, headline, url, source, source_type, market, category, summary, campaign_angle, published_at, fetched_at, raw_content)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of items) {
    stmt.run(
      item.id, item.headline, item.url, item.source, item.source_type,
      item.market, item.category, item.summary, item.campaign_angle,
      item.published_at, item.fetched_at, item.raw_content
    );
  }
}

function saveSocialTrends(trends) {
  const db = getDb();
  // Clear old trends
  db.prepare(`DELETE FROM social_trends WHERE fetched_at < datetime('now', '-2 hours')`).run();

  const stmt = db.prepare(`
    INSERT INTO social_trends (platform, market, topic, url, fetched_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const t of trends) {
    stmt.run(t.platform, t.market, t.topic, t.url, t.fetched_at);
  }
}

function getNewsItems({ market, category, limit = 50, offset = 0 } = {}) {
  const db = getDb();
  let query = `SELECT * FROM news_items WHERE 1=1`;
  const params = [];

  if (market && market !== 'ALL') {
    query += ` AND market = ?`;
    params.push(market);
  }
  if (category && category !== 'ALL') {
    query += ` AND category = ?`;
    params.push(category);
  }

  query += ` ORDER BY fetched_at DESC, published_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

function getSocialTrends({ market } = {}) {
  const db = getDb();
  let query = `SELECT * FROM social_trends WHERE fetched_at >= datetime('now', '-25 hours')`;
  const params = [];

  if (market && market !== 'ALL') {
    query += ` AND market = ?`;
    params.push(market);
  }

  query += ` ORDER BY fetched_at DESC`;
  return db.prepare(query).all(...params);
}

function getLastRefresh() {
  const db = getDb();
  return db.prepare(`SELECT * FROM refresh_log ORDER BY id DESC LIMIT 1`).get();
}

function logRefreshStart() {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO refresh_log (started_at, status) VALUES (datetime('now'), 'running')`
  );
  const result = stmt.run();
  return result.lastInsertRowid;
}

function logRefreshComplete(id, itemsFetched, error = null) {
  const db = getDb();
  db.prepare(`
    UPDATE refresh_log
    SET completed_at = datetime('now'), status = ?, items_fetched = ?, error_message = ?
    WHERE id = ?
  `).run(error ? 'error' : 'success', itemsFetched, error, id);
}

function cleanOldNews() {
  const db = getDb();
  db.prepare(`DELETE FROM news_items WHERE fetched_at < datetime('now', '-48 hours')`).run();
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
