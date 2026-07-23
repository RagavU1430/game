import { loadDB, saveDB } from '../_store.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = loadDB();
  const { teamName } = req.body || {};

  if (teamName) {
    db.activeTeams[teamName] = {
      id: 'team_' + Date.now(),
      teamName,
      startedAt: Date.now(),
      lastActive: Date.now(),
      score: 0,
      currentQuestion: 1,
      status: 'Playing'
    };
    saveDB(db);
  }

  res.status(200).json({ success: true, activeTeam: teamName ? db.activeTeams[teamName] : null });
}
