import { loadDB, saveDB } from '../_store.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = loadDB();
  db.leaderboard = [];
  db.activeTeams = {};
  saveDB(db);

  res.status(200).json({ success: true });
}
