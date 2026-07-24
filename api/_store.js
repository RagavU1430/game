import fs from 'fs';
import path from 'path';

const CLOUD_DB_URL = 'https://jsonblob.com/api/jsonBlob/019f8e6f-7446-7118-b999-df38f0083c8a';
const DB_FILE = process.env.VERCEL ? '/tmp/leaderboard_db.json' : path.resolve(process.cwd(), 'leaderboard_db.json');

export const DEFAULT_QUESTIONS = [
  {"id": 1, "image": "/images/q1.jpeg", "answer": 6, "title": "Beach Day", "hint": "Look at the sand castle, beach ball, and umbrella"},
  {"id": 2, "image": "/images/q2.jpeg", "answer": 3, "title": "Horse Racing", "hint": "Check the jockey's gear and the horse's features"},
  {"id": 3, "image": "/images/q3.jpeg", "answer": 3, "title": "Vegetables", "hint": "Compare the mushrooms, potatoes, and carrots"},
  {"id": 4, "image": "/images/q4.jpeg", "answer": 5, "title": "Art Class", "hint": "Look at the crayons, paint palette, and shapes"},
  {"id": 5, "image": "/images/q5.jpeg", "answer": 5, "title": "Zoo Visit", "hint": "Check the animals, children, and fence area"},
  {"id": 6, "image": "/images/q6.jpeg", "answer": 6, "title": "Construction", "hint": "Look at the workers, tools, and steel beams"},
  {"id": 7, "image": "/images/q7.jpeg", "answer": 5, "title": "Carnival Fun", "hint": "Check the ferris wheel, tent, and ticket booth"},
  {"id": 8, "image": "/images/q8.jpeg", "answer": 5, "title": "School Bus", "hint": "Look at the birds, bus number, and children"},
  {"id": 9, "image": "/images/q9.jpeg", "answer": 5, "title": "Baseball", "hint": "Check the trees, ball, and boy's clothes"},
  {"id": 10, "image": "/images/q10.jpeg", "answer": 3, "title": "Forest Picnic", "hint": "Look at the fruit, cup, and sky"}
];

export async function loadDB() {
  // 1. Try Global Cloud DB (for Vercel serverless global sync)
  try {
    const res = await fetch(CLOUD_DB_URL, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        return {
          leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [],
          activeTeams: (data.activeTeams && typeof data.activeTeams === 'object') ? data.activeTeams : {},
          questions: (Array.isArray(data.questions) && data.questions.length > 0) ? data.questions : DEFAULT_QUESTIONS,
          quizStatus: data.quizStatus || 'active',
          kickedTeams: Array.isArray(data.kickedTeams) ? data.kickedTeams : []
        };
      }
    }
  } catch (e) {}

  // 2. Local File Fallback
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return {
        leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [],
        activeTeams: (data.activeTeams && typeof data.activeTeams === 'object') ? data.activeTeams : {},
        questions: (Array.isArray(data.questions) && data.questions.length > 0) ? data.questions : DEFAULT_QUESTIONS,
        quizStatus: data.quizStatus || 'active',
        kickedTeams: Array.isArray(data.kickedTeams) ? data.kickedTeams : []
      };
    }
  } catch (e) {}

  return { leaderboard: [], activeTeams: {}, questions: DEFAULT_QUESTIONS, quizStatus: 'active', kickedTeams: [] };
}

export async function saveDB(data) {
  const payload = {
    leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [],
    activeTeams: (data.activeTeams && typeof data.activeTeams === 'object') ? data.activeTeams : {},
    questions: Array.isArray(data.questions) ? data.questions : DEFAULT_QUESTIONS,
    quizStatus: data.quizStatus || 'active',
    kickedTeams: Array.isArray(data.kickedTeams) ? data.kickedTeams : []
  };

  // 1. Save to Global Cloud DB across Vercel
  try {
    await fetch(CLOUD_DB_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {}

  // 2. Save to Local File
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2));
  } catch (e) {}
}
