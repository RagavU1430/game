import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();

  // Validate admin token
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || !(Array.isArray(db.adminTokens) && db.adminTokens.includes(token))) {
    return res.status(401).json({ error: 'Unauthorized — valid admin token required' });
  }

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
