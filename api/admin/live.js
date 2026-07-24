import { loadDB, saveDB, DEFAULT_QUESTIONS } from '../_store.js';

// Validate admin token from Authorization header
function isValidAdmin(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return false;
  // For Vercel, we need to check the DB each time
  return true; // Token validation happens in loadDB check below
}

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
