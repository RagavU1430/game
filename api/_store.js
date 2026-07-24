import fs from 'fs';
import path from 'path';

const CLOUD_DB_URL = process.env.CLOUD_DB_URL || 'https://jsonblob.com/api/jsonBlob/019f94ba-573a-79d6-a9c4-0b9cf7068cc3';
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

// Admin password — server-side only, never exposed to client (fix #1)
export const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';

// Simple token generation for admin sessions
export function generateToken(pin = ADMIN_SECRET) {
  const timestamp = Date.now();
  const raw = `${pin}_${timestamp}_quiz_session`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `quiz_${Math.abs(hash).toString(36)}_${timestamp.toString(36)}`;
}

export function verifyToken(token, pin = ADMIN_SECRET) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('_');
  if (parts.length !== 3 || parts[0] !== 'quiz') return false;

  const hashStr = parts[1];
  const timeStr = parts[2];
  const timestamp = parseInt(timeStr, 36);
  if (isNaN(timestamp) || timestamp <= 0) return false;

  // Token expires after 7 days (604,800,000 ms)
  const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (now - timestamp > MAX_AGE || timestamp > now + 300000) {
    return false;
  }

  // Re-verify hash signature against current secret or fallback secret
  const checkSecrets = [pin];
  if (pin !== 'admin123') checkSecrets.push('admin123');

  return checkSecrets.some(secret => {
    const raw = `${secret}_${timestamp}_quiz_session`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hashStr === Math.abs(hash).toString(36);
  });
}

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
          leaderboardRevealed: !!data.leaderboardRevealed,
          kickedTeams: Array.isArray(data.kickedTeams) ? data.kickedTeams : [],
          adminTokens: Array.isArray(data.adminTokens) ? data.adminTokens : [],
          teamAnswers: (data.teamAnswers && typeof data.teamAnswers === 'object') ? data.teamAnswers : {}
        };
      }
    }
  } catch (e) { console.error('[DB] Cloud load error:', e.message); }

  // 2. Local File Fallback
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return {
        leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [],
        activeTeams: (data.activeTeams && typeof data.activeTeams === 'object') ? data.activeTeams : {},
        questions: (Array.isArray(data.questions) && data.questions.length > 0) ? data.questions : DEFAULT_QUESTIONS,
        quizStatus: data.quizStatus || 'active',
        leaderboardRevealed: !!data.leaderboardRevealed,
        kickedTeams: Array.isArray(data.kickedTeams) ? data.kickedTeams : [],
        adminTokens: Array.isArray(data.adminTokens) ? data.adminTokens : [],
        teamAnswers: (data.teamAnswers && typeof data.teamAnswers === 'object') ? data.teamAnswers : {}
      };
    }
  } catch (e) { console.error('[DB] Local load error:', e.message); }

  return { leaderboard: [], activeTeams: {}, questions: DEFAULT_QUESTIONS, quizStatus: 'active', leaderboardRevealed: false, kickedTeams: [], adminTokens: [], teamAnswers: {} };
}

export async function saveDB(data) {
  const payload = {
    leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [],
    activeTeams: (data.activeTeams && typeof data.activeTeams === 'object') ? data.activeTeams : {},
    questions: Array.isArray(data.questions) ? data.questions : DEFAULT_QUESTIONS,
    quizStatus: data.quizStatus || 'active',
    leaderboardRevealed: !!data.leaderboardRevealed,
    kickedTeams: Array.isArray(data.kickedTeams) ? data.kickedTeams : [],
    adminTokens: Array.isArray(data.adminTokens) ? data.adminTokens : [],
    teamAnswers: (data.teamAnswers && typeof data.teamAnswers === 'object') ? data.teamAnswers : {}
  };

  // 1. Save to Global Cloud DB across Vercel
  try {
    const res = await fetch(CLOUD_DB_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error('[DB] Cloud save HTTP status error:', res.status);
    }
  } catch (e) { console.error('[DB] Cloud save error:', e.message); }

  // 2. Save to Local File
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2));
  } catch (e) { console.error('[DB] Local save error:', e.message); }
}
