import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();
  const { id, teamName } = req.body || {};

  if (id) {
    db.leaderboard = db.leaderboard.filter(item => item.id !== id);
  }
  if (teamName) {
    delete db.activeTeams[teamName];
    if (!Array.isArray(db.kickedTeams)) db.kickedTeams = [];
    if (!db.kickedTeams.includes(teamName)) {
      db.kickedTeams.push(teamName);
    }
  }
  await saveDB(db);

  res.status(200).json({ success: true, kickedTeams: db.kickedTeams });
}
