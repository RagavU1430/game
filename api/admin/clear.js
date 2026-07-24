import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();

  // Validate admin token
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || !(Array.isArray(db.adminTokens) && db.adminTokens.includes(token))) {
    return res.status(401).json({ error: 'Unauthorized — valid admin token required' });
  }

  // Clear all data including kickedTeams (fix #13)
  db.leaderboard = [];
  db.activeTeams = {};
  db.kickedTeams = [];
  db.teamAnswers = {};
  await saveDB(db);

  res.status(200).json({ success: true });
}
