import { loadDB, saveDB, verifyToken } from '../_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Validate admin token
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized — valid admin token required' });
  }

  const db = await loadDB();

  // Clear all data including kickedTeams and reset reveal state
  db.leaderboard = [];
  db.activeTeams = {};
  db.kickedTeams = [];
  db.teamAnswers = {};
  db.leaderboardRevealed = false;
  await saveDB(db);

  res.status(200).json({ success: true });
}
