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

  const { teamName, score, currentQuestion } = body;

  if (teamName) {
    const db = await loadDB();
    const isKicked = Array.isArray(db.kickedTeams) && db.kickedTeams.some(entry => {
      if (typeof entry === 'object') return entry.teamName === teamName;
      return entry === teamName;
    });
    if (isKicked) {
      if (db.activeTeams && db.activeTeams[teamName]) {
        delete db.activeTeams[teamName];
        await saveDB(db);
      }
      return res.status(200).json({ success: false, kicked: true });
    }

    if (!db.activeTeams) db.activeTeams = {};
    if (!db.activeTeams[teamName]) {
      db.activeTeams[teamName] = {
        id: 'team_' + Date.now(),
        teamName,
        startedAt: Date.now(),
        lastActive: Date.now(),
        score: score || 0,
        currentQuestion: currentQuestion || 1,
        status: 'Playing'
      };
    } else {
      // Use server-tracked score
      const serverData = db.teamAnswers && db.teamAnswers[teamName];
      db.activeTeams[teamName].score = serverData ? serverData.serverScore : (score || 0);
      db.activeTeams[teamName].currentQuestion = currentQuestion;
      db.activeTeams[teamName].lastActive = Date.now();
    }
    await saveDB(db);
  }

  res.status(200).json({ success: true });
}
