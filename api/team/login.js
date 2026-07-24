import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  body = body || {};

  const { teamName } = body;

  if (teamName) {
    // Kicked teams CANNOT re-login (fix #16)
    const isKicked = Array.isArray(db.kickedTeams) && db.kickedTeams.some(entry => {
      if (typeof entry === 'object') return entry.teamName === teamName;
      return entry === teamName;
    });
    if (isKicked) {
      return res.status(200).json({ success: false, kicked: true, message: 'This team has been removed by the admin.' });
    }

    db.activeTeams[teamName] = {
      id: 'team_' + Date.now(),
      teamName,
      startedAt: Date.now(),
      lastActive: Date.now(),
      score: 0,
      currentQuestion: 1,
      status: 'Playing'
    };
    // Initialize answer tracking
    if (!db.teamAnswers) db.teamAnswers = {};
    db.teamAnswers[teamName] = { answeredQuestions: [], serverScore: 0 };
    await saveDB(db);
  }

  res.status(200).json({ success: true, activeTeam: teamName ? db.activeTeams[teamName] : null });
}
