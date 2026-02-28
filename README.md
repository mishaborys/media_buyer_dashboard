# Media Buyer News Intelligence Dashboard

A daily news intelligence dashboard for media buyers. Aggregates trending news from Google News RSS, Reddit, and Twitter/X across USA, EU, LATAM, and Canada markets — enriched with AI-generated summaries and Facebook campaign angle suggestions.

## Features

- **Market-based news feed** — USA, EU, LATAM, Canada
- **Category filtering** — Tech, eCommerce, Finance, Auto, Savings & Benefits
- **AI campaign angles** — Claude-powered one-liner campaign suggestions per story
- **Social trends** — TikTok & Threads trending topics per market
- **Bookmark / Save** — localStorage-based bookmarks, no login required
- **Daily auto-refresh** — cron job at 6AM UTC

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Ant Design |
| Backend | Node.js + Express |
| Database | SQLite (built-in `node:sqlite`) |
| AI | Anthropic Claude API |
| Scheduling | node-cron |
| Deployment | Vercel |

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment variables

```bash
cp .env.example server/.env
```

Edit `server/.env` and fill in:

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key for AI summaries | Yes |
| `REDDIT_CLIENT_ID` | Reddit OAuth app client ID | Optional |
| `REDDIT_CLIENT_SECRET` | Reddit OAuth app client secret | Optional |
| `TWITTER_BEARER_TOKEN` | Twitter/X API Bearer Token | Optional |

> **Note:** Without API keys, the app still works — it fetches RSS feeds publicly and uses fallback text for AI summaries.

### 3. Run in development

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### 4. Trigger initial data refresh

Once the server is running, visit:
```
POST http://localhost:3001/api/refresh
```

Or click the **Refresh** button in the dashboard header.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/news` | Get news items (filter: `?market=USA&category=Tech`) |
| `GET` | `/api/news/social` | Get social trends (filter: `?market=USA`) |
| `GET` | `/api/news/status` | Last refresh status |
| `POST` | `/api/refresh` | Trigger manual refresh |
| `GET` | `/api/health` | Health check |

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel Dashboard
4. Deploy — Vercel automatically handles frontend + serverless backend + daily cron

> **SQLite note:** On Vercel, SQLite data lives in `/tmp` and resets on each cold start. For persistent storage, replace with [Vercel KV](https://vercel.com/docs/storage/vercel-kv) or a hosted database.

## Project Structure

```
media_buyer_dashboard/
├── client/                  # React + Ant Design frontend
│   └── src/
│       ├── components/      # Header, FilterBar, NewsCard, NewsGrid, etc.
│       ├── hooks/           # useNews, useBookmarks
│       └── App.jsx
├── server/                  # Node.js + Express backend
│   └── src/
│       ├── routes/          # /api/news, /api/refresh
│       └── services/        # database, newsAggregator, socialScraper, claudeService
├── vercel.json
└── .env.example
```
