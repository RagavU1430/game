import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();
  const { teamName, score, currentQuestion } = req.body || {};

  if (teamName) {
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
      db.activeTeams[teamName].score = score;
      db.activeTeams[teamName].currentQuestion = currentQuestion;
      db.activeTeams[teamName].lastActive = Date.now();
    }
    await saveDB(db);
  }

  res.status(200).json({ success: true });
}
