import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();

  if (req.method === 'GET') {
    return res.status(200).json({ status: db.quizStatus || 'active' });
  }

  if (req.method === 'POST') {
    const { status } = req.body || {};
    if (status === 'active' || status === 'paused') {
      db.quizStatus = status;
      await saveDB(db);
    }
    return res.status(200).json({ success: true, status: db.quizStatus });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
