import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();
  const { teamName, score, time } = req.body || {};

  if (teamName) {
    delete db.activeTeams[teamName];
    const newEntry = {
      id: 'lb_' + Date.now(),
      teamName,
      score,
      time,
      timestamp: Date.now(),
      status: 'Completed'
    };
    db.leaderboard.push(newEntry);
    await saveDB(db);
  }

  res.status(200).json({ success: true });
}
