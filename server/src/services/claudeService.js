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
        : 'Резюме недоступне.',
      campaign_angle: `Кут: Створіть Facebook-рекламу для користувачів, зацікавлених у темі ${item.category} на ринку ${item.market}.`,
    };
  }

  try {
    const anthropic = getClient();

    const categoryCtx = CATEGORY_CONTEXT[item.category] || item.category;
    const prompt = `Ти асистент медіабаєра, який допомагає створювати рекламні кампанії у Facebook.

Проаналізуй цю новину:
Заголовок: ${item.headline}
Джерело: ${item.source}
Ринок: ${item.market}
Категорія: ${item.category} (${categoryCtx})
Зміст: ${item.raw_content || 'Без додаткового змісту'}

Надай відповідь у JSON з двома полями:
1. "summary": Резюме новини у 2-3 реченнях УКРАЇНСЬКОЮ МОВОЮ — коротко і зрозуміло для медіабаєра.
2. "campaign_angle": Одне речення УКРАЇНСЬКОЮ МОВОЮ — конкретна ідея Facebook-кампанії для аудиторії ${item.market}, починається з "Кут:".

Відповідай ТІЛЬКИ валідним JSON, без жодного іншого тексту.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    const parsed = JSON.parse(text);

    return {
      summary: parsed.summary || 'Резюме недоступне.',
      campaign_angle: parsed.campaign_angle || `Кут: Використайте цей тренд у категорії ${item.category} для Facebook-кампаній на ринку ${item.market}.`,
    };
  } catch (err) {
    console.error(`[Claude] Failed to process item "${item.headline}":`, err.message);
    return {
      summary: item.raw_content
        ? item.raw_content.substring(0, 250) + '...'
        : 'Резюме недоступне.',
      campaign_angle: `Кут: Використайте цю тему категорії ${item.category} для таргетованої Facebook-реклами на ринку ${item.market}.`,
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
          summary: 'Резюме недоступне.',
          campaign_angle: `Кут: Використайте цей тренд у категорії ${item.category} для Facebook-кампаній на ринку ${item.market}.`,
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
