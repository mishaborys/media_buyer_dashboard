const RSSParser = require('rss-parser');
const crypto = require('crypto');
const axios = require('axios');

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
    { url: 'https://news.google.com/rss/search?q=walmart+clearance+sale+deals&hl=en-US&gl=US&ceid=US:en', category: 'Clearance Sales' },
    { url: 'https://news.google.com/rss/search?q=target+best+buy+costco+clearance+sale&hl=en-US&gl=US&ceid=US:en', category: 'Clearance Sales' },
    { url: 'https://news.google.com/rss/search?q=macys+kohls+nordstrom+sale+discount+markdown&hl=en-US&gl=US&ceid=US:en', category: 'Clearance Sales' },
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
    { url: 'https://news.google.com/rss/search?q=zalando+asos+sale+clearance+discount+uk&hl=en-GB&gl=GB&ceid=GB:en', category: 'Clearance Sales' },
    { url: 'https://news.google.com/rss/search?q=mediamarkt+saturn+carrefour+sale+deals+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Clearance Sales' },
    { url: 'https://news.google.com/rss/search?q=primark+zara+hm+marks+spencer+sale+clearance&hl=en-GB&gl=GB&ceid=GB:en', category: 'Clearance Sales' },
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
    { url: 'https://news.google.com/rss/search?q=mercado+libre+oferta+liquidacion+descuento&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Clearance Sales' },
    { url: 'https://news.google.com/rss/search?q=falabella+liverpool+coppel+oferta+temporada&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Clearance Sales' },
    { url: 'https://news.google.com/rss/search?q=americanas+extra+casas+bahia+liquidacao+promocao&hl=pt-BR&gl=BR&ceid=BR:pt-419', category: 'Clearance Sales' },
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
  'Clearance Sales': ['clearance', 'liquidation', 'markdown', 'liquidacion', 'liquidacao', 'promocao', 'walmart', 'target', 'bestbuy', 'best buy', 'costco', 'macy', 'kohls', 'nordstrom', 'zalando', 'asos', 'mediamarkt', 'carrefour', 'primark', 'mercado libre', 'falabella', 'liverpool', 'coppel', 'americanas', 'casas bahia'],
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

// Reddit via public RSS — top posts of the day only (high engagement)
async function fetchRedditRSS() {
  const now = new Date().toISOString();
  const allSubs = Object.entries(REDDIT_SUBREDDITS).flatMap(([market, subs]) =>
    subs.slice(0, 2).map((sub) => ({ market, sub }))
  );

  const results = await Promise.allSettled(
    allSubs.map(async ({ market, sub }) => {
      try {
        const feed = await parser.parseURL(`https://www.reddit.com/r/${sub}/top.rss?t=day&limit=5`);
        return (feed.items || []).slice(0, 3).map((item) => ({
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

// Parse "10K+", "500K+", "1M+" → number for sorting by absolute volume
function parseApproxTraffic(str) {
  if (!str) return 0;
  const s = str.replace(/[+\s,]/g, '');
  if (s.toUpperCase().endsWith('M')) return parseFloat(s) * 1_000_000;
  if (s.toUpperCase().endsWith('K')) return parseFloat(s) * 1_000;
  return parseFloat(s) || 0;
}

// Google Trends — top searches by absolute volume in each country
async function fetchGoogleTrends() {
  const now = new Date().toISOString();

  const results = await Promise.allSettled(
    GOOGLE_TRENDS_GEOS.map(async ({ geo, market }) => {
      try {
        const feed = await trendsParser.parseURL(
          `https://trends.google.com/trending/rss?geo=${geo}`
        );
        // Fetch up to 20, sort by search volume descending, keep top 5
        const sorted = (feed.items || [])
          .slice(0, 20)
          .sort((a, b) => parseApproxTraffic(b.approxTraffic) - parseApproxTraffic(a.approxTraffic))
          .slice(0, 5);

        return sorted.map((item) => ({
          id: generateId(`gtrends-${geo}-${item.title || ''}`, item.title || ''),
          headline: `🔥 ${item.title || ''}`,
          // Link to Google Search for the query — more actionable than Trends chart
          url: `https://www.google.com/search?q=${encodeURIComponent(item.title || '')}`,
          source: `Google Trends (${geo})`,
          source_type: 'google_trends',
          market,
          category: detectCategory(item.title || ''),
          summary: null,
          campaign_angle: null,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : now,
          fetched_at: now,
          raw_content: item.approxTraffic
            ? `~${item.approxTraffic} searches`
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

// Regex fallback for heavily malformed RSS feeds
function parseRSSWithRegex(xml) {
  const items = [];
  const itemRegex = /<item[\s>][\s\S]*?<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[0];
    const getField = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
      return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
    };
    const link =
      (block.match(/<link>([^<]+)<\/link>/i) || block.match(/<link[^>]+href="([^"]+)"/i) || [])[1]?.trim() ||
      getField('guid');
    const title = getField('title');
    const pubDate = getField('pubDate');
    const description = getField('description');
    if (title) items.push({ title, link: link || '', pubDate, contentSnippet: description.substring(0, 500) });
  }
  return { items };
}

// Fetch raw XML, sanitize & chars, try XML parse then fallback to regex
async function fetchSanitizedRSS(url) {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MediaBuyerBot/1.0)' },
    responseType: 'text',
  });
  const raw = response.data;
  const sanitized = raw.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
  try {
    return await parser.parseString(sanitized);
  } catch {
    return parseRSSWithRegex(raw);
  }
}

// Deal aggregator RSS feeds — verified working (no API key required)
const DEALS_RSS_FEEDS = [
  // USA
  { url: 'https://www.dealnews.com/?rss=1', market: 'USA', label: 'DealNews' },
  // EU
  { url: 'https://www.mydealz.de/rss/hot', market: 'EU', label: 'Mydealz (DE)' },
  { url: 'https://www.dealabs.com/rss/hot', market: 'EU', label: 'Dealabs (FR)' },
  { url: 'https://www.hotukdeals.com/deals.rss', market: 'EU', label: 'HotUKDeals (UK)', sanitize: true },
  // LATAM
  { url: 'https://www.promodescuentos.com/rss/hot', market: 'LATAM', label: 'Promodescuentos (MX)' },
  { url: 'https://www.chollometro.com/rss/hot', market: 'LATAM', label: 'Chollometro (ES/LATAM)' },
];

async function fetchDealsRSS() {
  const now = new Date().toISOString();
  const results = await Promise.allSettled(
    DEALS_RSS_FEEDS.map(async ({ url, market, label, sanitize }) => {
      try {
        const feed = sanitize ? await fetchSanitizedRSS(url) : await parser.parseURL(url);
        return (feed.items || []).slice(0, 5).map((item) => ({
          id: generateId(`deals-${label}-${item.link || ''}`, item.title || ''),
          headline: item.title || 'No headline',
          url: item.link || '',
          source: label,
          source_type: 'deals_rss',
          market,
          category: 'Clearance Sales',
          summary: null,
          campaign_angle: null,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : now,
          fetched_at: now,
          raw_content: item.contentSnippet ? item.contentSnippet.substring(0, 500) : item.title || '',
        }));
      } catch (err) {
        console.error(`[DealsRSS] Failed ${label}: ${err.message}`);
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
  console.log('[NewsAggregator] Fetching Google News RSS, Reddit RSS, Google Trends, Deals RSS in parallel...');
  const [rssResult, redditResult, trendsResult, dealsResult] = await Promise.allSettled([
    fetchGoogleNewsRSS(),
    fetchRedditRSS(),
    fetchGoogleTrends(),
    fetchDealsRSS(),
  ]);

  const allItems = [
    ...(rssResult.status === 'fulfilled' ? rssResult.value : []),
    ...(redditResult.status === 'fulfilled' ? redditResult.value : []),
    ...(trendsResult.status === 'fulfilled' ? trendsResult.value : []),
    ...(dealsResult.status === 'fulfilled' ? dealsResult.value : []),
  ];

  const deduplicated = deduplicateItems(allItems);
  console.log(`[NewsAggregator] Fetched ${deduplicated.length} unique items`);
  return deduplicated;
}

module.exports = { fetchAllNews };
