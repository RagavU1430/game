import { loadDB, saveDB, DEFAULT_QUESTIONS, verifyToken } from '../_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Validate admin token
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized — valid admin token required' });
  }

  const db = await loadDB();

  if (req.method === 'GET') {
    // Admin gets questions WITH answers
    return res.status(200).json({ questions: db.questions || DEFAULT_QUESTIONS });
  }

  if (req.method === 'POST') {
    const { action, question, questions, id } = req.body || {};

    if (action === 'reset') {
      db.questions = [...DEFAULT_QUESTIONS];
    } else if (action === 'set' && Array.isArray(questions)) {
      db.questions = questions;
    } else if (action === 'add' && question) {
      const nextId = db.questions.length > 0 ? Math.max(...db.questions.map(q => q.id)) + 1 : 1;
      db.questions.push({ ...question, id: nextId });
    } else if (action === 'update' && question && question.id) {
      db.questions = db.questions.map(q => q.id === question.id ? { ...q, ...question } : q);
    } else if (action === 'delete' && id) {
      db.questions = db.questions.filter(q => q.id !== id);
    }

    await saveDB(db);
    return res.status(200).json({ success: true, questions: db.questions });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
