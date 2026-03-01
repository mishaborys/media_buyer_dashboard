const RSSParser = require('rss-parser');
const crypto = require('crypto');

const parser = new RSSParser({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MediaBuyerBot/1.0)' },
});

// Separate parser for Google Trends (needs ht: namespace support)
const trendsParser = new RSSParser({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MediaBuyerBot/1.0)' },
  customFields: { item: [['ht:approx_traffic', 'approxTraffic']] },
});

// Market-specific Google News RSS feed configs
const GOOGLE_NEWS_FEEDS = {
  USA: [
    { url: 'https://news.google.com/rss/search?q=technology+gadgets+AI+software&hl=en-US&gl=US&ceid=US:en', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=samsung+galaxy+iphone+pixel+smartphone+launch&hl=en-US&gl=US&ceid=US:en', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=ecommerce+online+shopping&hl=en-US&gl=US&ceid=US:en', category: 'eCommerce' },
    { url: 'https://news.google.com/rss/search?q=mortgage+rates+finance+credit&hl=en-US&gl=US&ceid=US:en', category: 'Finance' },
    { url: 'https://news.google.com/rss/search?q=car+auto+deals+EV&hl=en-US&gl=US&ceid=US:en', category: 'Auto' },
    { url: 'https://news.google.com/rss/search?q=savings+benefits+retirement+deals&hl=en-US&gl=US&ceid=US:en', category: 'Savings & Benefits' },
    { url: 'https://news.google.com/rss/search?q=video+game+release+2025+xbox+playstation+nintendo+pc&hl=en-US&gl=US&ceid=US:en', category: 'Gaming' },
    { url: 'https://news.google.com/rss/search?q=new+tv+series+streaming+netflix+hbo+disney+premiere+2025&hl=en-US&gl=US&ceid=US:en', category: 'Entertainment' },
  ],
  EU: [
    { url: 'https://news.google.com/rss/search?q=technology+gadgets+AI+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=samsung+galaxy+iphone+smartphone+launch+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=ecommerce+shopping+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'eCommerce' },
    { url: 'https://news.google.com/rss/search?q=mortgage+finance+credit+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Finance' },
    { url: 'https://news.google.com/rss/search?q=car+auto+EV+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Auto' },
    { url: 'https://news.google.com/rss/search?q=savings+benefits+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Savings & Benefits' },
    { url: 'https://news.google.com/rss/search?q=video+game+release+xbox+playstation+nintendo+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Gaming' },
    { url: 'https://news.google.com/rss/search?q=new+tv+series+streaming+netflix+hbo+premiere+uk+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Entertainment' },
  ],
  LATAM: [
    { url: 'https://news.google.com/rss/search?q=tecnologia+gadgets+IA+latinoamerica&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=samsung+galaxy+iphone+smartphone+lanzamiento&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=ecommerce+compras+online+latam&hl=es-419&gl=MX&ceid=MX:es-419', category: 'eCommerce' },
    { url: 'https://news.google.com/rss/search?q=hipoteca+credito+finanzas+latam&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Finance' },
    { url: 'https://news.google.com/rss/search?q=autos+carros+electrico+latam&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Auto' },
    { url: 'https://news.google.com/rss/search?q=ahorro+beneficios+latam&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Savings & Benefits' },
    { url: 'https://news.google.com/rss/search?q=videojuegos+lanzamiento+xbox+playstation+nintendo&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Gaming' },
    { url: 'https://news.google.com/rss/search?q=nueva+serie+streaming+netflix+estreno+temporada&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Entertainment' },
  ],
  Canada: [
    { url: 'https://news.google.com/rss/search?q=technology+gadgets+AI+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=samsung+galaxy+iphone+smartphone+launch+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=ecommerce+shopping+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'eCommerce' },
    { url: 'https://news.google.com/rss/search?q=mortgage+rates+finance+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'Finance' },
    { url: 'https://news.google.com/rss/search?q=car+auto+deals+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'Auto' },
    { url: 'https://news.google.com/rss/search?q=savings+benefits+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'Savings & Benefits' },
    { url: 'https://news.google.com/rss/search?q=video+game+release+xbox+playstation+nintendo+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'Gaming' },
    { url: 'https://news.google.com/rss/search?q=new+tv+series+streaming+netflix+hbo+premiere+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'Entertainment' },
  ],
};

// Reddit subreddits per market
const REDDIT_SUBREDDITS = {
  USA: ['personalfinance', 'technology', 'deals', 'frugal', 'cars', 'investing', 'gadgets'],
  EU: ['europe', 'unitedkingdom', 'germany', 'financialindependence'],
  LATAM: ['mexico', 'argentina', 'brasil', 'colombia'],
  Canada: ['canada', 'PersonalFinanceCanada', 'canadafinance'],
};

// Google Trends countries mapped to markets
const GOOGLE_TRENDS_GEOS = [
  // USA
  { geo: 'US', market: 'USA' },
  // EU — 5 major countries
  { geo: 'GB', market: 'EU' },
  { geo: 'DE', market: 'EU' },
  { geo: 'FR', market: 'EU' },
  { geo: 'ES', market: 'EU' },
  { geo: 'IT', market: 'EU' },
  // Canada
  { geo: 'CA', market: 'Canada' },
  // LATAM — 4 countries
  { geo: 'MX', market: 'LATAM' },
  { geo: 'BR', market: 'LATAM' },
  { geo: 'AR', market: 'LATAM' },
  { geo: 'CO', market: 'LATAM' },
];

const CATEGORY_KEYWORDS = {
  Tech: ['tech', 'technology', 'gadget', 'phone', 'laptop', 'ai', 'software', 'app', 'device', 'samsung', 'iphone', 'pixel', 'smartphone'],
  eCommerce: ['ecommerce', 'shopping', 'deal', 'sale', 'product', 'amazon', 'retail', 'discount'],
  Finance: ['finance', 'mortgage', 'loan', 'credit', 'bank', 'invest', 'stock', 'rate', 'money'],
  Auto: ['car', 'auto', 'vehicle', 'ev', 'electric', 'truck', 'suv', 'drive'],
  'Savings & Benefits': ['save', 'saving', 'benefit', 'retire', 'coupon', 'cashback', 'frugal', 'budget'],
  Gaming: ['game', 'gaming', 'xbox', 'playstation', 'nintendo', 'steam', 'esport', 'gamer', 'dlc', 'indie game'],
  Entertainment: ['series', 'streaming', 'netflix', 'hbo', 'disney', 'movie', 'film', 'premiere', 'season', 'episode', 'trailer'],
};

function generateId(url, headline) {
  return crypto.createHash('md5').update(`${url}${headline}`).digest('hex');
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return 'Tech';
}

async function fetchOneFeed(market, feed, now) {
  try {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || []).slice(0, 5).map((item) => ({
      id: generateId(item.link || '', item.title || ''),
      headline: item.title || 'No headline',
      url: item.link || '',
      source: item.creator || parsed.title || 'Google News',
      source_type: 'google_news',
      market,
      category: feed.category,
      summary: null,
      campaign_angle: null,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : now,
      fetched_at: now,
      raw_content: item.contentSnippet || item.content || '',
    }));
  } catch (err) {
    console.error(`[GoogleNews] Failed: ${feed.url} — ${err.message}`);
    return [];
  }
}

async function fetchGoogleNewsRSS() {
  const now = new Date().toISOString();
  const allFeeds = Object.entries(GOOGLE_NEWS_FEEDS).flatMap(([market, feeds]) =>
    feeds.map((feed) => ({ market, feed }))
  );
  const results = await Promise.allSettled(
    allFeeds.map(({ market, feed }) => fetchOneFeed(market, feed, now))
  );
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

// Reddit via public RSS — no OAuth needed, fully parallel
async function fetchRedditRSS() {
  const now = new Date().toISOString();
  const allSubs = Object.entries(REDDIT_SUBREDDITS).flatMap(([market, subs]) =>
    subs.slice(0, 3).map((sub) => ({ market, sub }))
  );

  const results = await Promise.allSettled(
    allSubs.map(async ({ market, sub }) => {
      try {
        const feed = await parser.parseURL(`https://www.reddit.com/r/${sub}/hot.rss?limit=5`);
        return (feed.items || []).slice(0, 5).map((item) => ({
          id: generateId(`reddit-${sub}-${item.link || ''}`, item.title || ''),
          headline: item.title || 'No headline',
          url: item.link || '',
          source: `Reddit r/${sub}`,
          source_type: 'reddit',
          market,
          category: detectCategory((item.title || '') + ' ' + (item.contentSnippet || '')),
          summary: null,
          campaign_angle: null,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : now,
          fetched_at: now,
          raw_content: item.contentSnippet ? item.contentSnippet.substring(0, 500) : item.title || '',
        }));
      } catch (err) {
        console.error(`[Reddit RSS] Failed r/${sub}: ${err.message}`);
        return [];
      }
    })
  );

  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

// Google Trends daily trending searches via public RSS — no API key needed
async function fetchGoogleTrends() {
  const now = new Date().toISOString();

  const results = await Promise.allSettled(
    GOOGLE_TRENDS_GEOS.map(async ({ geo, market }) => {
      try {
        const feed = await trendsParser.parseURL(
          `https://trends.google.com/trending/rss?geo=${geo}`
        );
        return (feed.items || []).slice(0, 5).map((item) => ({
          id: generateId(`gtrends-${geo}-${item.title || ''}`, item.title || ''),
          headline: `🔥 ${item.title || ''}`,
          url: item.link || `https://trends.google.com/trending?geo=${geo}`,
          source: `Google Trends (${geo})`,
          source_type: 'google_trends',
          market,
          category: detectCategory(item.title || ''),
          summary: null,
          campaign_angle: null,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : now,
          fetched_at: now,
          raw_content: item.approxTraffic
            ? `Trending in ${geo}: ~${item.approxTraffic} searches`
            : item.title || '',
        }));
      } catch (err) {
        console.error(`[GoogleTrends] Failed geo=${geo}: ${err.message}`);
        return [];
      }
    })
  );

  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

function deduplicateItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

async function fetchAllNews() {
  console.log('[NewsAggregator] Fetching Google News RSS, Reddit RSS, Google Trends in parallel...');
  const [rssResult, redditResult, trendsResult] = await Promise.allSettled([
    fetchGoogleNewsRSS(),
    fetchRedditRSS(),
    fetchGoogleTrends(),
  ]);

  const allItems = [
    ...(rssResult.status === 'fulfilled' ? rssResult.value : []),
    ...(redditResult.status === 'fulfilled' ? redditResult.value : []),
    ...(trendsResult.status === 'fulfilled' ? trendsResult.value : []),
  ];

  const deduplicated = deduplicateItems(allItems);
  console.log(`[NewsAggregator] Fetched ${deduplicated.length} unique items`);
  return deduplicated;
}

module.exports = { fetchAllNews };
