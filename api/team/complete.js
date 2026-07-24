import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  body = body || {};

  const { teamName, score, time } = body;

  if (teamName) {
    // Check if team already exists in leaderboard
    const existingIndex = (db.leaderboard || []).findIndex(entry => entry.teamName.toLowerCase() === teamName.toLowerCase());

    // Use server-tracked score if available, fallback to client score
    const serverData = db.teamAnswers && db.teamAnswers[teamName];
    const validatedScore = (serverData && typeof serverData.serverScore === 'number') 
      ? serverData.serverScore 
      : (typeof score === 'number' ? score : 0);

    const validatedTime = (typeof time === 'number' && time >= 0) ? time : 0;

    if (db.activeTeams && db.activeTeams[teamName]) {
      delete db.activeTeams[teamName];
    }

    const entryToSave = {
      id: 'lb_' + Date.now(),
      teamName,
      score: validatedScore,
      time: validatedTime,
      timestamp: Date.now(),
      status: 'Completed'
    };

    if (!Array.isArray(db.leaderboard)) db.leaderboard = [];

    if (existingIndex >= 0) {
      db.leaderboard[existingIndex] = entryToSave;
    } else {
      db.leaderboard.push(entryToSave);
    }

    // Clean up team answers tracking
    if (db.teamAnswers && db.teamAnswers[teamName]) {
      delete db.teamAnswers[teamName];
    }

    await saveDB(db);
  }

  res.status(200).json({ success: true });
}
