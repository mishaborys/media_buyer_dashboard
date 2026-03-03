require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { clerkMiddleware } = require('@clerk/express');

const newsRouter = require('./routes/news');
const refreshRouter = require('./routes/refresh');
const reactionsRouter = require('./routes/reactions');

const app = express();

// Дозволяємо будь-який origin на Vercel (фронт та бекенд — один домен)
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // дозволяємо всі (same-domain на Vercel)
  },
  methods: ['GET', 'POST'],
}));
app.use(express.json());
app.use(clerkMiddleware());

app.use('/api/news', newsRouter);
app.use('/api/refresh', refreshRouter);
app.use('/api/reactions', reactionsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
