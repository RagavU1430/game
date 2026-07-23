import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, 'leaderboard_db.json');

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { leaderboard: [], activeTeams: {} };
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
                activeTeams: Object.values(db.activeTeams)
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
