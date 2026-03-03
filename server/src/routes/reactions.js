const express = require('express');
const router = express.Router();
const { getAuth } = require('@clerk/express');
const db = require('../services/database');

// All reactions routes require a valid Clerk session
router.use((req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  next();
});

// GET /api/reactions?type=like
router.get('/', async (req, res) => {
  const { userId } = getAuth(req);
  const { type = 'like' } = req.query;
  try {
    const items = await db.getUserReactions(userId, type);
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('[GET /api/reactions]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/reactions  body: { newsItemId, reaction: 'like'|'dislike' }
router.post('/', async (req, res) => {
  const { userId } = getAuth(req);
  const { newsItemId, reaction } = req.body;
  if (!newsItemId || !reaction) {
    return res.status(400).json({ success: false, error: 'newsItemId and reaction are required' });
  }
  try {
    await db.setUserReaction(userId, newsItemId, reaction);
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/reactions]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/reactions/:newsItemId
router.delete('/:newsItemId', async (req, res) => {
  const { userId } = getAuth(req);
  const { newsItemId } = req.params;
  try {
    await db.removeUserReaction(userId, newsItemId);
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/reactions]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
