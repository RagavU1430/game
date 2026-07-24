import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  body = body || {};

  const { teamName, questionId, answer } = body;

  if (!teamName || questionId === undefined || answer === undefined) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  // Check if kicked
  const isKicked = Array.isArray(db.kickedTeams) && db.kickedTeams.some(entry => {
    if (typeof entry === 'object') return entry.teamName === teamName;
    return entry === teamName;
  });
  if (isKicked) {
    return res.status(200).json({ success: false, kicked: true });
  }

  // Initialize tracking if needed
  if (!db.teamAnswers) db.teamAnswers = {};
  if (!db.teamAnswers[teamName]) {
    db.teamAnswers[teamName] = { answeredQuestions: [], serverScore: 0 };
  }

  const teamData = db.teamAnswers[teamName];

  // Prevent re-answering same question (compare as strings/numbers safely)
  const hasAlreadyAnswered = teamData.answeredQuestions.some(qId => String(qId) === String(questionId));
  if (hasAlreadyAnswered) {
    return res.status(200).json({
      success: true,
      correct: false,
      alreadyAnswered: true,
      serverScore: teamData.serverScore
    });
  }

  // Find the question and validate answer (type-safe comparison)
  const question = (db.questions || []).find(q => String(q.id) === String(questionId));
  if (!question) {
    return res.status(400).json({ success: false, error: 'Invalid question ID' });
  }

  const isCorrect = Number(answer) === Number(question.answer);
  teamData.answeredQuestions.push(question.id);
  if (isCorrect) {
    teamData.serverScore += 1;
  }

  // Update active team score
  if (db.activeTeams && db.activeTeams[teamName]) {
    db.activeTeams[teamName].score = teamData.serverScore;
  }

  await saveDB(db);
  res.status(200).json({
    success: true,
    correct: isCorrect,
    serverScore: teamData.serverScore
  });
}
