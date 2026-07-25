import { loadDB, DEFAULT_QUESTIONS } from './_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();
  const rawQuestions = (Array.isArray(db.questions) && db.questions.length > 0) ? db.questions : DEFAULT_QUESTIONS;

  // Return client-safe questions (without correct answers)
  const clientSafeQuestions = rawQuestions.map(({ answer, ...rest }) => rest);
  res.status(200).json({ questions: clientSafeQuestions });
}
