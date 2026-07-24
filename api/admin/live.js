import { loadDB, saveDB, DEFAULT_QUESTIONS, verifyToken } from '../_store.js';

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

  const now = Date.now();
  // Clean up active teams older than 30 mins
  Object.keys(db.activeTeams).forEach(name => {
    if (now - db.activeTeams[name].lastActive > 1800000) {
      delete db.activeTeams[name];
    }
  });
  await saveDB(db);

  // Return full data including questions, status, kickedTeams (fix #12)
  res.status(200).json({
    leaderboard: db.leaderboard,
    activeTeams: Object.values(db.activeTeams),
    questions: db.questions || DEFAULT_QUESTIONS,
    quizStatus: db.quizStatus || 'active',
    kickedTeams: db.kickedTeams || []
  });
}
