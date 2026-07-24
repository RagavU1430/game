import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();
  const { teamName, score, currentQuestion } = req.body || {};

  if (teamName) {
    const isKicked = Array.isArray(db.kickedTeams) && db.kickedTeams.some(entry => {
      if (typeof entry === 'object') return entry.teamName === teamName;
      return entry === teamName;
    });
    if (isKicked) {
      delete db.activeTeams[teamName];
      await saveDB(db);
      return res.status(200).json({ success: false, kicked: true });
    }

    if (db.activeTeams[teamName]) {
      // Use server-tracked score
      const serverData = db.teamAnswers && db.teamAnswers[teamName];
      db.activeTeams[teamName].score = serverData ? serverData.serverScore : (score || 0);
      db.activeTeams[teamName].currentQuestion = currentQuestion;
      db.activeTeams[teamName].lastActive = Date.now();
      await saveDB(db);
    }
  }

  res.status(200).json({ success: true });
}
