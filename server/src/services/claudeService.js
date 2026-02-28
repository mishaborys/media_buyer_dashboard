const Anthropic = require('@anthropic-ai/sdk');

let client;

function getClient() {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

const CATEGORY_CONTEXT = {
  Tech: 'phones, laptops, gadgets, software, AI tools',
  eCommerce: 'online shopping, deals, products, retail discounts',
  Finance: 'mortgages, loans, credit cards, investments, interest rates',
  Auto: 'cars, EVs, auto financing, vehicle deals',
  'Savings & Benefits': 'saving money, government benefits, retirement, coupons, cashback',
};

async function generateSummaryAndAngle(item) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      summary: item.raw_content
        ? item.raw_content.substring(0, 200) + '...'
        : 'News summary not available.',
      campaign_angle: `Angle: Create a Facebook ad targeting users interested in ${item.category} topics in the ${item.market} market.`,
    };
  }

  try {
    const anthropic = getClient();

    const categoryCtx = CATEGORY_CONTEXT[item.category] || item.category;
    const prompt = `You are a media buyer assistant helping create Facebook ad campaigns.

Analyze this news item:
Title: ${item.headline}
Source: ${item.source}
Market: ${item.market}
Category: ${item.category} (${categoryCtx})
Content: ${item.raw_content || 'No additional content'}

Provide a JSON response with exactly these two fields:
1. "summary": A 2-3 sentence summary of the news item in plain English, suitable for a media buyer to quickly understand its significance.
2. "campaign_angle": A single sentence campaign angle starting with "Angle:" that suggests how to use this topic for a Facebook ad campaign targeting ${item.market} audiences. Be specific and actionable.

Respond ONLY with valid JSON, no other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    const parsed = JSON.parse(text);

    return {
      summary: parsed.summary || 'Summary not available.',
      campaign_angle: parsed.campaign_angle || `Angle: Leverage this ${item.category} trend for Facebook campaigns in ${item.market}.`,
    };
  } catch (err) {
    console.error(`[Claude] Failed to process item "${item.headline}":`, err.message);
    return {
      summary: item.raw_content
        ? item.raw_content.substring(0, 250) + '...'
        : 'Summary not available.',
      campaign_angle: `Angle: Use this trending ${item.category} topic to create targeted Facebook ads for the ${item.market} market.`,
    };
  }
}

async function enrichNewsItems(items) {
  console.log(`[Claude] Enriching ${items.length} news items...`);

  // Process in batches to avoid rate limits
  const BATCH_SIZE = 5;
  const enriched = [];

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((item) => generateSummaryAndAngle(item))
    );

    for (let j = 0; j < batch.length; j++) {
      const item = batch[j];
      const result = results[j];

      if (result.status === 'fulfilled') {
        enriched.push({
          ...item,
          summary: result.value.summary,
          campaign_angle: result.value.campaign_angle,
        });
      } else {
        enriched.push({
          ...item,
          summary: 'Summary not available.',
          campaign_angle: `Angle: Leverage this ${item.category} trend for Facebook campaigns in ${item.market}.`,
        });
      }
    }

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`[Claude] Enriched ${enriched.length} items`);
  return enriched;
}

module.exports = { enrichNewsItems };
