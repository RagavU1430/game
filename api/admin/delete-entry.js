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

  const { id, teamName } = req.body || {};

  if (id) {
    db.leaderboard = db.leaderboard.filter(item => item.id !== id);
  }
  if (teamName) {
    delete db.activeTeams[teamName];
    if (!Array.isArray(db.kickedTeams)) db.kickedTeams = [];
    // Store as object with timestamp for expiry (fix #15)
    const alreadyKicked = db.kickedTeams.some(entry => {
      if (typeof entry === 'object') return entry.teamName === teamName;
      return entry === teamName;
    });
    if (!alreadyKicked) {
      db.kickedTeams.push({ teamName, kickedAt: Date.now() });
    }
    // Clean up team answers
    if (db.teamAnswers && db.teamAnswers[teamName]) {
      delete db.teamAnswers[teamName];
    }
  }
  await saveDB(db);

  res.status(200).json({ success: true, kickedTeams: db.kickedTeams });
}
