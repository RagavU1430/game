import { loadDB, saveDB } from '../_store.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = loadDB();
  const now = Date.now();

  // Clean up active teams older than 30 mins
  Object.keys(db.activeTeams).forEach(name => {
    if (now - db.activeTeams[name].lastActive > 1800000) {
      delete db.activeTeams[name];
    }
  });
  saveDB(db);

  res.status(200).json({
    leaderboard: db.leaderboard,
    activeTeams: Object.values(db.activeTeams)
  });
}
