import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();
  db.leaderboard = [];
  db.activeTeams = {};
  await saveDB(db);

  res.status(200).json({ success: true });
}
