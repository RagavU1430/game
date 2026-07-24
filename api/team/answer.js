import { loadDB, saveDB } from '../_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = await loadDB();
  const { teamName, questionId, answer } = req.body || {};

  if (!teamName || !questionId || answer === undefined) {
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

  // Prevent re-answering same question
  if (teamData.answeredQuestions.includes(questionId)) {
    return res.status(200).json({ success: false, error: 'Already answered', correct: false });
  }

  // Find the question and validate answer
  const question = (db.questions || []).find(q => q.id === questionId);
  if (!question) {
    return res.status(200).json({ success: false, error: 'Invalid question' });
  }

  const isCorrect = Number(answer) === question.answer;
  teamData.answeredQuestions.push(questionId);
  if (isCorrect) {
    teamData.serverScore += 1;
  }

  // Update active team score
  if (db.activeTeams[teamName]) {
    db.activeTeams[teamName].score = teamData.serverScore;
  }

  await saveDB(db);
  res.status(200).json({
    success: true,
    correct: isCorrect,
    serverScore: teamData.serverScore
  });
}
