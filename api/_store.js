import fs from 'fs';
import path from 'path';

// Memory fallback for serverless execution
let inMemoryDB = { leaderboard: [], activeTeams: {} };

const DB_FILE = process.env.VERCEL ? '/tmp/leaderboard_db.json' : path.resolve(process.cwd(), 'leaderboard_db.json');

export function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      inMemoryDB = {
        leaderboard: data.leaderboard || [],
        activeTeams: data.activeTeams || {}
      };
    }
  } catch (e) {}
  return inMemoryDB;
}

export function saveDB(data) {
  inMemoryDB = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {}
}
