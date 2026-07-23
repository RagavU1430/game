import fs from 'fs';
import path from 'path';

const CLOUD_DB_URL = 'https://jsonblob.com/api/jsonBlob/019f8e6f-7446-7118-b999-df38f0083c8a';
const DB_FILE = process.env.VERCEL ? '/tmp/leaderboard_db.json' : path.resolve(process.cwd(), 'leaderboard_db.json');

export async function loadDB() {
  // 1. Try Global Cloud DB (for Vercel serverless global sync)
  try {
    const res = await fetch(CLOUD_DB_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        return {
          leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [],
          activeTeams: (data.activeTeams && typeof data.activeTeams === 'object') ? data.activeTeams : {}
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
        activeTeams: (data.activeTeams && typeof data.activeTeams === 'object') ? data.activeTeams : {}
      };
    }
  } catch (e) {}

  return { leaderboard: [], activeTeams: {} };
}

export async function saveDB(data) {
  const payload = {
    leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : [],
    activeTeams: (data.activeTeams && typeof data.activeTeams === 'object') ? data.activeTeams : {}
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
