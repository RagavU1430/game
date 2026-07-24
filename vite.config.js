import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, 'leaderboard_db.json');

// Import shared defaults (single source of truth)
import { DEFAULT_QUESTIONS, CLIENT_QUESTIONS, ADMIN_SECRET, generateToken, verifyToken } from './shared/defaults.js';

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return {
        leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
        activeTeams: (parsed.activeTeams && typeof parsed.activeTeams === 'object') ? parsed.activeTeams : {},
        questions: (Array.isArray(parsed.questions) && parsed.questions.length > 0) ? parsed.questions : DEFAULT_QUESTIONS,
        quizStatus: parsed.quizStatus || 'active',
        kickedTeams: Array.isArray(parsed.kickedTeams) ? parsed.kickedTeams : [],
        adminTokens: Array.isArray(parsed.adminTokens) ? parsed.adminTokens : [],
        teamAnswers: (parsed.teamAnswers && typeof parsed.teamAnswers === 'object') ? parsed.teamAnswers : {}
      };
    }
  } catch (e) { console.error('[DB] Load error:', e.message); }
  return { leaderboard: [], activeTeams: {}, questions: DEFAULT_QUESTIONS, quizStatus: 'active', kickedTeams: [], adminTokens: [], teamAnswers: {} };
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) { console.error('[DB] Save error:', e.message); }
}

const db = loadDB();

// Validate admin token from Authorization header
function isValidAdmin(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return false;
  return verifyToken(token, ADMIN_SECRET);
}

// Clean expired kicked teams (older than 24 hours)
function cleanExpiredKicks() {
  if (!Array.isArray(db.kickedTeams)) { db.kickedTeams = []; return; }
  const now = Date.now();
  db.kickedTeams = db.kickedTeams.filter(entry => {
    if (typeof entry === 'object' && entry.kickedAt) {
      return (now - entry.kickedAt) < 86400000; // 24 hours
    }
    // Legacy string entries — keep them (no timestamp)
    return true;
  });
}

function isTeamKicked(teamName) {
  if (!Array.isArray(db.kickedTeams)) return false;
  return db.kickedTeams.some(entry => {
    if (typeof entry === 'object') return entry.teamName === teamName;
    return entry === teamName;
  });
}

function liveQuizApiPlugin() {
  return {
    name: 'live-quiz-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        
        if (url.startsWith('/api/')) {
          res.setHeader('Content-Type', 'application/json');
          // Restricted CORS — same origin only (no wildcard)
          const origin = req.headers.origin || '';
          if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
          }
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            return res.end();
          }

          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { if (bodyStr) body = JSON.parse(bodyStr); } catch (e) { console.error('[API] JSON parse error:', e.message); }

            cleanExpiredKicks();

            // ============================================================
            // PUBLIC ENDPOINTS (no auth required)
            // ============================================================

            // 1. Team Login / Start
            if (url === '/api/team/login') {
              const { teamName } = body;
              if (teamName) {
                // Kicked teams CANNOT re-login (fix #16 — no kick bypass)
                if (isTeamKicked(teamName)) {
                  res.end(JSON.stringify({ success: false, kicked: true, message: 'This team has been removed by the admin.' }));
                  return;
                }

                db.activeTeams[teamName] = {
                  id: 'team_' + Date.now(),
                  teamName,
                  startedAt: Date.now(),
                  lastActive: Date.now(),
                  score: 0,
                  currentQuestion: 1,
                  status: 'Playing'
                };
                // Initialize answer tracking for this team
                if (!db.teamAnswers) db.teamAnswers = {};
                db.teamAnswers[teamName] = { answeredQuestions: [], serverScore: 0 };
                saveDB(db);
              }
              res.end(JSON.stringify({ success: true, activeTeam: db.activeTeams[teamName] || null }));
              return;
            }

            // 2. Team Question Progress
            if (url === '/api/team/progress') {
              const { teamName, score, currentQuestion } = body;
              if (teamName) {
                if (isTeamKicked(teamName)) {
                  delete db.activeTeams[teamName];
                  saveDB(db);
                  res.end(JSON.stringify({ success: false, kicked: true }));
                  return;
                }

                if (db.activeTeams[teamName]) {
                  // Use server-tracked score, not client-provided
                  const serverData = db.teamAnswers && db.teamAnswers[teamName];
                  db.activeTeams[teamName].score = serverData ? serverData.serverScore : (score || 0);
                  db.activeTeams[teamName].currentQuestion = currentQuestion;
                  db.activeTeams[teamName].lastActive = Date.now();
                  saveDB(db);
                }
              }
              res.end(JSON.stringify({ success: true }));
              return;
            }

            // 3. Team Submit Answer (NEW — server-side validation, fix #7)
            if (url === '/api/team/answer') {
              const { teamName, questionId, answer } = body;
              if (!teamName || !questionId || answer === undefined) {
                res.end(JSON.stringify({ success: false, error: 'Missing fields' }));
                return;
              }

              if (isTeamKicked(teamName)) {
                res.end(JSON.stringify({ success: false, kicked: true }));
                return;
              }

              // Initialize tracking if needed
              if (!db.teamAnswers) db.teamAnswers = {};
              if (!db.teamAnswers[teamName]) {
                db.teamAnswers[teamName] = { answeredQuestions: [], serverScore: 0 };
              }

              const teamData = db.teamAnswers[teamName];

              // Prevent re-answering same question
              if (teamData.answeredQuestions.includes(questionId)) {
                res.end(JSON.stringify({ success: false, error: 'Already answered', correct: false }));
                return;
              }

              // Find the question and validate
              const question = db.questions.find(q => q.id === questionId);
              if (!question) {
                res.end(JSON.stringify({ success: false, error: 'Invalid question' }));
                return;
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

              saveDB(db);
              res.end(JSON.stringify({
                success: true,
                correct: isCorrect,
                serverScore: teamData.serverScore
              }));
              return;
            }

            // 4. Team Complete Quiz (fix #8 & #9 — validate score/time/duplicates)
            if (url === '/api/team/complete') {
              const { teamName, score, time } = body;
              if (teamName) {
                // Check for duplicate submission
                const alreadyCompleted = db.leaderboard.some(entry => entry.teamName === teamName);
                if (alreadyCompleted) {
                  delete db.activeTeams[teamName];
                  saveDB(db);
                  res.end(JSON.stringify({ success: false, error: 'Team already submitted results' }));
                  return;
                }

                // Use server-tracked score, not client-provided (fix #9)
                const serverData = db.teamAnswers && db.teamAnswers[teamName];
                const validatedScore = serverData ? serverData.serverScore : 0;

                // Validate time — must be positive and reasonable (< 2 hours)
                const validatedTime = (typeof time === 'number' && time > 0 && time < 7200000) ? time : 0;

                delete db.activeTeams[teamName];
                const newEntry = {
                  id: 'lb_' + Date.now(),
                  teamName,
                  score: validatedScore,
                  time: validatedTime,
                  timestamp: Date.now(),
                  status: 'Completed'
                };
                db.leaderboard.push(newEntry);

                // Clean up team answers tracking
                if (db.teamAnswers && db.teamAnswers[teamName]) {
                  delete db.teamAnswers[teamName];
                }

                saveDB(db);
              }
              res.end(JSON.stringify({ success: true }));
              return;
            }

            // 5. Get client-safe questions (no answers)
            if (url === '/api/questions' && req.method === 'GET') {
              // Return questions WITHOUT answers for client
              const safeQuestions = (db.questions || DEFAULT_QUESTIONS).map(({ answer, ...rest }) => rest);
              res.end(JSON.stringify({ questions: safeQuestions }));
              return;
            }

            // 6. Get quiz status (public)
            if (url === '/api/status' && req.method === 'GET') {
              res.end(JSON.stringify({ status: db.quizStatus || 'active' }));
              return;
            }

            // ============================================================
            // ADMIN AUTH ENDPOINT (public — issues token)
            // ============================================================

            if (url === '/api/admin/auth') {
              const { passcode } = body;
              if (passcode === ADMIN_SECRET) {
                const token = generateToken(passcode);
                if (!Array.isArray(db.adminTokens)) db.adminTokens = [];
                db.adminTokens.push(token);
                // Keep only last 10 tokens to prevent unbounded growth
                if (db.adminTokens.length > 10) {
                  db.adminTokens = db.adminTokens.slice(-10);
                }
                saveDB(db);
                res.end(JSON.stringify({ success: true, token }));
              } else {
                res.statusCode = 401;
                res.end(JSON.stringify({ success: false, error: 'Invalid passcode' }));
              }
              return;
            }

            // ============================================================
            // ADMIN ENDPOINTS (auth required — fix #2)
            // ============================================================

            // Check admin auth for all /api/admin/* routes (except /api/admin/auth)
            if (url.startsWith('/api/admin/') && url !== '/api/admin/auth') {
              if (!isValidAdmin(req)) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'Unauthorized — valid admin token required' }));
                return;
              }
            }

            // Admin Live Data Sync
            if (url === '/api/admin/live') {
              const now = Date.now();
              Object.keys(db.activeTeams).forEach(name => {
                if (now - db.activeTeams[name].lastActive > 1800000) {
                  delete db.activeTeams[name];
                }
              });

              res.end(JSON.stringify({
                leaderboard: db.leaderboard,
                activeTeams: Object.values(db.activeTeams),
                questions: db.questions,
                quizStatus: db.quizStatus || 'active',
                kickedTeams: db.kickedTeams || []
              }));
              return;
            }

            // Admin Clear All (fix #13 — also clear kickedTeams)
            if (url === '/api/admin/clear') {
              db.leaderboard = [];
              db.activeTeams = {};
              db.kickedTeams = [];
              db.teamAnswers = {};
              saveDB(db);
              res.end(JSON.stringify({ success: true }));
              return;
            }

            // Admin Delete Individual Entry / Kick Team
            if (url === '/api/admin/delete-entry') {
              const { id, teamName } = body;
              if (id) {
                db.leaderboard = db.leaderboard.filter(item => item.id !== id);
              }
              if (teamName) {
                delete db.activeTeams[teamName];
                if (!Array.isArray(db.kickedTeams)) db.kickedTeams = [];
                // Store as object with timestamp for expiry (fix #15)
                const alreadyKicked = db.kickedTeams.some(entry => {
                  if (typeof entry === 'object') return entry.teamName === teamName;
                  return entry === teamName;
                });
                if (!alreadyKicked) {
                  db.kickedTeams.push({ teamName, kickedAt: Date.now() });
                }
                // Clean up team answers
                if (db.teamAnswers && db.teamAnswers[teamName]) {
                  delete db.teamAnswers[teamName];
                }
              }
              saveDB(db);
              res.end(JSON.stringify({ success: true, kickedTeams: db.kickedTeams }));
              return;
            }

            // Admin Questions Bank Endpoint (with answers — admin only)
            if (url === '/api/admin/questions') {
              if (req.method === 'GET') {
                res.end(JSON.stringify({ questions: db.questions }));
                return;
              }
              const { action, question, questions, id } = body;
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
              saveDB(db);
              res.end(JSON.stringify({ success: true, questions: db.questions }));
              return;
            }

            // Admin Quiz Status Endpoint
            if (url === '/api/admin/status') {
              if (req.method === 'GET') {
                res.end(JSON.stringify({ status: db.quizStatus || 'active' }));
                return;
              }
              const { status } = body;
              if (status === 'active' || status === 'paused') {
                db.quizStatus = status;
                saveDB(db);
              }
              res.end(JSON.stringify({ success: true, status: db.quizStatus }));
              return;
            }

            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Endpoint not found' }));
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), liveQuizApiPlugin()],
  server: {
    host: true,
    port: 5173
  }
});
