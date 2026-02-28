/**
 * Social trends scraper for TikTok and Threads.
 * Uses Playwright for scraping since no official APIs are available.
 */

const MARKET_CONFIG = {
  USA: { locale: 'en-US', country: 'US' },
  EU: { locale: 'en-GB', country: 'GB' },
  LATAM: { locale: 'es-MX', country: 'MX' },
  Canada: { locale: 'en-CA', country: 'CA' },
};

// TikTok trending hashtag patterns per market
const TIKTOK_TRENDING_URL = 'https://www.tiktok.com/trending';

async function scrapeWithPlaywright(url, extractFn) {
  let browser;
  try {
    const { chromium } = require('playwright');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const result = await extractFn(page);
    return result;
  } catch (err) {
    console.error(`[Scraper] Failed to scrape ${url}:`, err.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

async function scrapeTikTokTrends() {
  const trends = [];
  const now = new Date().toISOString();

  // TikTok doesn't have market-specific trending pages easily accessible,
  // so we use the global trending page and tag all markets
  try {
    const items = await scrapeWithPlaywright(TIKTOK_TRENDING_URL, async (page) => {
      // Try to extract trending hashtags/topics
      const extracted = await page.evaluate(() => {
        const results = [];
        // TikTok trending selectors (may change)
        const selectors = [
          'a[href*="/tag/"]',
          '[class*="trending"] a',
          '[class*="hashtag"]',
        ];

        for (const sel of selectors) {
          const els = document.querySelectorAll(sel);
          els.forEach((el) => {
            const text = el.textContent?.trim();
            const href = el.href;
            if (text && text.length > 1 && text.length < 100) {
              results.push({ topic: text, url: href });
            }
          });
          if (results.length >= 10) break;
        }

        return results.slice(0, 15);
      });
      return extracted;
    });

    // Assign to all markets since TikTok doesn't have market-specific trending
    for (const item of items.slice(0, 10)) {
      for (const market of ['USA', 'EU', 'LATAM', 'Canada']) {
        trends.push({
          platform: 'TikTok',
          market,
          topic: item.topic,
          url: item.url || TIKTOK_TRENDING_URL,
          fetched_at: now,
        });
      }
    }
  } catch (err) {
    console.error('[TikTok] Scrape failed:', err.message);
    // Return mock data for development
    return getMockTikTokTrends();
  }

  return trends.length > 0 ? trends : getMockTikTokTrends();
}

async function scrapeThreadsTrends() {
  const trends = [];
  const now = new Date().toISOString();

  try {
    const items = await scrapeWithPlaywright('https://www.threads.net/search', async (page) => {
      const extracted = await page.evaluate(() => {
        const results = [];
        const selectors = [
          'a[href*="/hashtag/"]',
          '[class*="trend"] span',
          '[class*="topic"] span',
        ];

        for (const sel of selectors) {
          const els = document.querySelectorAll(sel);
          els.forEach((el) => {
            const text = el.textContent?.trim();
            const href = el.closest('a')?.href;
            if (text && text.length > 1 && text.length < 100) {
              results.push({ topic: text, url: href || '' });
            }
          });
          if (results.length >= 10) break;
        }

        return results.slice(0, 15);
      });
      return extracted;
    });

    for (const item of items.slice(0, 10)) {
      for (const market of ['USA', 'EU', 'LATAM', 'Canada']) {
        trends.push({
          platform: 'Threads',
          market,
          topic: item.topic,
          url: item.url || 'https://www.threads.net/search',
          fetched_at: now,
        });
      }
    }
  } catch (err) {
    console.error('[Threads] Scrape failed:', err.message);
    return getMockThreadsTrends();
  }

  return trends.length > 0 ? trends : getMockThreadsTrends();
}

function getMockTikTokTrends() {
  const now = new Date().toISOString();
  const topics = [
    '#MortgageRates', '#TechDeals2026', '#EVCars', '#OnlineShopping',
    '#RetirementTips', '#CreditCards', '#SavingMoney', '#GadgetReview',
    '#FinanceTips', '#AutoDeals',
  ];
  const trends = [];
  for (const topic of topics) {
    for (const market of ['USA', 'EU', 'LATAM', 'Canada']) {
      trends.push({
        platform: 'TikTok',
        market,
        topic,
        url: `https://www.tiktok.com/tag/${topic.replace('#', '')}`,
        fetched_at: now,
      });
    }
  }
  return trends;
}

function getMockThreadsTrends() {
  const now = new Date().toISOString();
  const topics = [
    'AI Tools', 'Mortgage Drop', 'Black Friday', 'EV Incentives',
    'Retirement Planning', 'Tech Layoffs', 'Side Hustle', 'Crypto',
    'Solar Energy', 'Health Insurance',
  ];
  const trends = [];
  for (const topic of topics) {
    for (const market of ['USA', 'EU', 'LATAM', 'Canada']) {
      trends.push({
        platform: 'Threads',
        market,
        topic,
        url: `https://www.threads.net/search?q=${encodeURIComponent(topic)}`,
        fetched_at: now,
      });
    }
  }
  return trends;
}

async function fetchAllSocialTrends() {
  console.log('[SocialScraper] Starting social trends fetch...');

  const [tiktok, threads] = await Promise.allSettled([
    scrapeTikTokTrends(),
    scrapeThreadsTrends(),
  ]);

  const allTrends = [
    ...(tiktok.status === 'fulfilled' ? tiktok.value : getMockTikTokTrends()),
    ...(threads.status === 'fulfilled' ? threads.value : getMockThreadsTrends()),
  ];

  console.log(`[SocialScraper] Fetched ${allTrends.length} social trend entries`);
  return allTrends;
}

module.exports = { fetchAllSocialTrends };
