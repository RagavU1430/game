import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();
  const { teamName, score, time } = req.body || {};

  if (teamName) {
    // Check for duplicate submission (fix #8)
    const alreadyCompleted = db.leaderboard.some(entry => entry.teamName === teamName);
    if (alreadyCompleted) {
      delete db.activeTeams[teamName];
      await saveDB(db);
      return res.status(200).json({ success: false, error: 'Team already submitted results' });
    }

    // Use server-tracked score, not client-provided (fix #9)
    const serverData = db.teamAnswers && db.teamAnswers[teamName];
    const validatedScore = serverData ? serverData.serverScore : 0;

    // Validate time (must be positive and < 2 hours)
    const validatedTime = (typeof time === 'number' && time > 0 && time < 7200000) ? time : 0;

    delete db.activeTeams[teamName];
    const newEntry = {
      id: 'lb_' + Date.now(),
      teamName,
      score: validatedScore,
      time: validatedTime,
      timestamp: Date.now(),
      status: 'Completed'
    };
    db.leaderboard.push(newEntry);

    // Clean up team answers tracking
    if (db.teamAnswers && db.teamAnswers[teamName]) {
      delete db.teamAnswers[teamName];
    }

    await saveDB(db);
  }

  res.status(200).json({ success: true });
}
