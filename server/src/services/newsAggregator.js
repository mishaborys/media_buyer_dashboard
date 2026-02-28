const axios = require('axios');
const RSSParser = require('rss-parser');
const crypto = require('crypto');

const parser = new RSSParser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; MediaBuyerBot/1.0)',
  },
});

// Market-specific Google News RSS feed configs
const GOOGLE_NEWS_FEEDS = {
  USA: [
    { url: 'https://news.google.com/rss/search?q=technology+gadgets&hl=en-US&gl=US&ceid=US:en', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=ecommerce+online+shopping&hl=en-US&gl=US&ceid=US:en', category: 'eCommerce' },
    { url: 'https://news.google.com/rss/search?q=mortgage+rates+finance+credit&hl=en-US&gl=US&ceid=US:en', category: 'Finance' },
    { url: 'https://news.google.com/rss/search?q=car+auto+deals+EV&hl=en-US&gl=US&ceid=US:en', category: 'Auto' },
    { url: 'https://news.google.com/rss/search?q=savings+benefits+retirement+deals&hl=en-US&gl=US&ceid=US:en', category: 'Savings & Benefits' },
  ],
  EU: [
    { url: 'https://news.google.com/rss/search?q=technology+gadgets+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=ecommerce+shopping+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'eCommerce' },
    { url: 'https://news.google.com/rss/search?q=mortgage+finance+credit+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Finance' },
    { url: 'https://news.google.com/rss/search?q=car+auto+EV+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Auto' },
    { url: 'https://news.google.com/rss/search?q=savings+benefits+europe&hl=en-GB&gl=GB&ceid=GB:en', category: 'Savings & Benefits' },
  ],
  LATAM: [
    { url: 'https://news.google.com/rss/search?q=tecnologia+gadgets+latinoamerica&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=ecommerce+compras+online+latam&hl=es-419&gl=MX&ceid=MX:es-419', category: 'eCommerce' },
    { url: 'https://news.google.com/rss/search?q=hipoteca+credito+finanzas+latam&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Finance' },
    { url: 'https://news.google.com/rss/search?q=autos+carros+latam&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Auto' },
    { url: 'https://news.google.com/rss/search?q=ahorro+beneficios+latam&hl=es-419&gl=MX&ceid=MX:es-419', category: 'Savings & Benefits' },
  ],
  Canada: [
    { url: 'https://news.google.com/rss/search?q=technology+gadgets+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'Tech' },
    { url: 'https://news.google.com/rss/search?q=ecommerce+shopping+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'eCommerce' },
    { url: 'https://news.google.com/rss/search?q=mortgage+rates+finance+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'Finance' },
    { url: 'https://news.google.com/rss/search?q=car+auto+deals+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'Auto' },
    { url: 'https://news.google.com/rss/search?q=savings+benefits+canada&hl=en-CA&gl=CA&ceid=CA:en', category: 'Savings & Benefits' },
  ],
};

// Reddit subreddits per market/category
const REDDIT_SUBREDDITS = {
  USA: ['personalfinance', 'technology', 'deals', 'frugal', 'cars', 'investing', 'gadgets'],
  EU: ['europe', 'unitedkingdom', 'germany', 'financialindependence'],
  LATAM: ['mexico', 'argentina', 'brasil', 'colombia'],
  Canada: ['canada', 'PersonalFinanceCanada', 'canadafinance'],
};

const CATEGORY_KEYWORDS = {
  Tech: ['tech', 'technology', 'gadget', 'phone', 'laptop', 'AI', 'software', 'app', 'device'],
  eCommerce: ['ecommerce', 'shopping', 'deal', 'sale', 'product', 'amazon', 'retail', 'discount'],
  Finance: ['finance', 'mortgage', 'loan', 'credit', 'bank', 'invest', 'stock', 'rate', 'money'],
  Auto: ['car', 'auto', 'vehicle', 'ev', 'electric', 'truck', 'suv', 'drive'],
  'Savings & Benefits': ['save', 'saving', 'benefit', 'retire', 'coupon', 'cashback', 'frugal', 'budget'],
};

function generateId(url, headline) {
  return crypto.createHash('md5').update(`${url}${headline}`).digest('hex');
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return 'Tech'; // default
}

async function fetchGoogleNewsRSS() {
  const items = [];
  const now = new Date().toISOString();

  for (const [market, feeds] of Object.entries(GOOGLE_NEWS_FEEDS)) {
    for (const feed of feeds) {
      try {
        const parsed = await parser.parseURL(feed.url);
        const feedItems = (parsed.items || []).slice(0, 5); // top 5 per feed

        for (const item of feedItems) {
          items.push({
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
          });
        }
      } catch (err) {
        console.error(`[GoogleNews] Failed to fetch ${feed.url}:`, err.message);
      }
    }
  }

  return items;
}

async function fetchRedditPosts() {
  const items = [];
  const now = new Date().toISOString();

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  // Get Reddit access token
  let accessToken = null;
  if (clientId && clientSecret) {
    try {
      const tokenRes = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        'grant_type=client_credentials',
        {
          auth: { username: clientId, password: clientSecret },
          headers: { 'User-Agent': 'MediaBuyerBot/1.0' },
        }
      );
      accessToken = tokenRes.data.access_token;
    } catch (err) {
      console.error('[Reddit] Token fetch failed:', err.message);
    }
  }

  for (const [market, subreddits] of Object.entries(REDDIT_SUBREDDITS)) {
    for (const sub of subreddits.slice(0, 3)) {
      try {
        const headers = { 'User-Agent': 'MediaBuyerBot/1.0' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const baseUrl = accessToken ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
        const res = await axios.get(`${baseUrl}/r/${sub}/hot.json?limit=5`, { headers });
        const posts = res.data?.data?.children || [];

        for (const post of posts) {
          const d = post.data;
          if (d.stickied || d.over_18) continue;

          items.push({
            id: generateId(`reddit-${d.id}`, d.title),
            headline: d.title,
            url: `https://reddit.com${d.permalink}`,
            source: `Reddit r/${sub}`,
            source_type: 'reddit',
            market,
            category: detectCategory(d.title + ' ' + (d.selftext || '')),
            summary: null,
            campaign_angle: null,
            published_at: new Date(d.created_utc * 1000).toISOString(),
            fetched_at: now,
            raw_content: d.selftext ? d.selftext.substring(0, 500) : d.title,
          });
        }
      } catch (err) {
        console.error(`[Reddit] Failed to fetch r/${sub}:`, err.message);
      }
    }
  }

  return items;
}

async function fetchTwitterTrends() {
  const items = [];
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;

  if (!bearerToken) {
    console.log('[Twitter] No bearer token configured, skipping');
    return items;
  }

  const now = new Date().toISOString();

  // Woeid codes for trending topics: 1=worldwide, 23424977=US, 23424975=UK, 23424975=Canada
  const LOCATIONS = [
    { market: 'USA', woeid: 23424977 },
    { market: 'Canada', woeid: 23424775 },
    { market: 'EU', woeid: 23424975 },
  ];

  for (const loc of LOCATIONS) {
    try {
      const res = await axios.get(
        `https://api.twitter.com/1.1/trends/place.json?id=${loc.woeid}`,
        { headers: { Authorization: `Bearer ${bearerToken}` } }
      );

      const trends = res.data?.[0]?.trends?.slice(0, 5) || [];
      for (const trend of trends) {
        items.push({
          id: generateId(`twitter-${loc.market}-${trend.name}`, trend.name),
          headline: trend.name,
          url: trend.url || `https://twitter.com/search?q=${encodeURIComponent(trend.name)}`,
          source: 'Twitter/X Trending',
          source_type: 'twitter',
          market: loc.market,
          category: detectCategory(trend.name),
          summary: null,
          campaign_angle: null,
          published_at: now,
          fetched_at: now,
          raw_content: trend.tweet_volume ? `~${trend.tweet_volume} tweets` : '',
        });
      }
    } catch (err) {
      console.error(`[Twitter] Failed to fetch trends for ${loc.market}:`, err.message);
    }
  }

  return items;
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
  console.log('[NewsAggregator] Starting news fetch...');

  const [googleItems, redditItems] = await Promise.allSettled([
    fetchGoogleNewsRSS(),
    fetchRedditPosts(),
  ]);

  const allItems = [
    ...(googleItems.status === 'fulfilled' ? googleItems.value : []),
    ...(redditItems.status === 'fulfilled' ? redditItems.value : []),
  ];

  const deduplicated = deduplicateItems(allItems);
  console.log(`[NewsAggregator] Fetched ${deduplicated.length} unique items`);

  return deduplicated;
}

module.exports = { fetchAllNews };
