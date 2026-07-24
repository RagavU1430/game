import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, 'leaderboard_db.json');

const DEFAULT_QUESTIONS = [
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

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return {
        leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
        activeTeams: (parsed.activeTeams && typeof parsed.activeTeams === 'object') ? parsed.activeTeams : {},
        questions: (Array.isArray(parsed.questions) && parsed.questions.length > 0) ? parsed.questions : DEFAULT_QUESTIONS,
        quizStatus: parsed.quizStatus || 'active'
      };
    }
  } catch (e) {}
  return { leaderboard: [], activeTeams: {}, questions: DEFAULT_QUESTIONS, quizStatus: 'active' };
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {}
}

const db = loadDB();

function liveQuizApiPlugin() {
  return {
    name: 'live-quiz-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        
        if (url.startsWith('/api/')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');
          
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            return res.end();
          }

          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', () => {
            let body = {};
            try { if (bodyStr) body = JSON.parse(bodyStr); } catch (e) {}

            // 1. Team Login / Start
            if (url === '/api/team/login') {
              const { teamName } = body;
              if (teamName) {
                db.activeTeams[teamName] = {
                  id: 'team_' + Date.now(),
                  teamName,
                  startedAt: Date.now(),
                  lastActive: Date.now(),
                  score: 0,
                  currentQuestion: 1,
                  status: 'Playing'
                };
                saveDB(db);
              }
              res.end(JSON.stringify({ success: true, activeTeam: db.activeTeams[teamName] }));
              return;
            }

            // 2. Team Question Progress
            if (url === '/api/team/progress') {
              const { teamName, score, currentQuestion } = body;
              if (teamName && db.activeTeams[teamName]) {
                db.activeTeams[teamName].score = score;
                db.activeTeams[teamName].currentQuestion = currentQuestion;
                db.activeTeams[teamName].lastActive = Date.now();
                saveDB(db);
              }
              res.end(JSON.stringify({ success: true }));
              return;
            }

            // 3. Team Complete Quiz
            if (url === '/api/team/complete') {
              const { teamName, score, time } = body;
              if (teamName) {
                delete db.activeTeams[teamName];
                const newEntry = {
                  id: 'lb_' + Date.now(),
                  teamName,
                  score,
                  time,
                  timestamp: Date.now(),
                  status: 'Completed'
                };
                db.leaderboard.push(newEntry);
                saveDB(db);
              }
              res.end(JSON.stringify({ success: true }));
              return;
            }

            // 4. Admin Live Data Sync
            if (url === '/api/admin/live') {
              const now = Date.now();
              // Clean up active teams idle for > 30 mins
              Object.keys(db.activeTeams).forEach(name => {
                if (now - db.activeTeams[name].lastActive > 1800000) {
                  delete db.activeTeams[name];
                }
              });

              res.end(JSON.stringify({
                leaderboard: db.leaderboard,
                activeTeams: Object.values(db.activeTeams),
                questions: db.questions,
                quizStatus: db.quizStatus || 'active'
              }));
              return;
            }

            // 5. Admin Clear All
            if (url === '/api/admin/clear') {
              db.leaderboard = [];
              db.activeTeams = {};
              saveDB(db);
              res.end(JSON.stringify({ success: true }));
              return;
            }

            // 6. Admin Delete Individual Entry
            if (url === '/api/admin/delete-entry') {
              const { id, teamName } = body;
              if (id) {
                db.leaderboard = db.leaderboard.filter(item => item.id !== id);
              }
              if (teamName) {
                delete db.activeTeams[teamName];
              }
              saveDB(db);
              res.end(JSON.stringify({ success: true }));
              return;
            }

            // 7. Admin Questions Bank Endpoint
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

            // 8. Admin Quiz Status Endpoint
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
    host: true, // Exposes server to local network (0.0.0.0)
    port: 5173
  }
});
