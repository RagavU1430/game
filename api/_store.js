import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DB_FILE = process.env.VERCEL ? '/tmp/leaderboard_db.json' : path.resolve(process.cwd(), 'leaderboard_db.json');
const CLOUD_DB_URL = process.env.CLOUD_DB_URL;
const CLOUD_DB_TOKEN = process.env.CLOUD_DB_TOKEN;

export const DEFAULT_QUESTIONS = [
  { id: 1, image: '/images/q1.jpeg', answer: 6, title: 'Beach Day', hint: 'Look at the sand castle, beach ball, and umbrella' },
  { id: 2, image: '/images/q2.jpeg', answer: 3, title: 'Horse Racing', hint: "Check the jockey's gear and the horse's features" },
  { id: 3, image: '/images/q3.jpeg', answer: 3, title: 'Vegetables', hint: 'Compare the mushrooms, potatoes, and carrots' },
  { id: 4, image: '/images/q4.jpeg', answer: 5, title: 'Art Class', hint: 'Look at the crayons, paint palette, and shapes' },
  { id: 5, image: '/images/q5.jpeg', answer: 8, title: 'Zoo Visit', hint: 'Check the animals, children, and fence area' },
  { id: 6, image: '/images/q6.jpeg', answer: 6, title: 'Construction', hint: 'Look at the workers, tools, and steel beams' },
  { id: 7, image: '/images/q7.jpeg', answer: 4, title: 'Carnival Fun', hint: 'Check the ferris wheel, tent, and ticket booth' },
  { id: 8, image: '/images/q8.jpeg', answer: 7, title: 'School Bus', hint: 'Look at the birds, bus number, and children' },
  { id: 9, image: '/images/q9.jpeg', answer: 3, title: 'Baseball', hint: "Check the trees, ball, and boy's clothes" },
  { id: 10, image: '/images/q10.jpeg', answer: 15, title: 'Forest Picnic', hint: 'Look at the fruit, cup, and sky' }
];
const emptyDB = () => ({ leaderboard: [], activeTeams: {}, questions: DEFAULT_QUESTIONS, quizStatus: 'active', leaderboardRevealed: false, kickedTeams: [], teamAnswers: {} });
function normalizeDB(data) { return { leaderboard: Array.isArray(data?.leaderboard) ? data.leaderboard : [], activeTeams: data?.activeTeams && typeof data.activeTeams === 'object' ? data.activeTeams : {}, questions: Array.isArray(data?.questions) && data.questions.length ? data.questions : DEFAULT_QUESTIONS, quizStatus: data?.quizStatus === 'paused' ? 'paused' : 'active', leaderboardRevealed: Boolean(data?.leaderboardRevealed), kickedTeams: Array.isArray(data?.kickedTeams) ? data.kickedTeams : [], teamAnswers: data?.teamAnswers && typeof data.teamAnswers === 'object' ? data.teamAnswers : {} }; }
function storageHeaders() { return { 'Content-Type': 'application/json', Accept: 'application/json', ...(CLOUD_DB_TOKEN ? { Authorization: `Bearer ${CLOUD_DB_TOKEN}` } : {}) }; }
export async function loadDB() {
  if (CLOUD_DB_URL) { const res = await fetch(CLOUD_DB_URL, { headers: storageHeaders(), cache: 'no-store' }); if (!res.ok) throw new Error(`Database read failed (${res.status})`); return normalizeDB(await res.json()); }
  if (process.env.VERCEL) throw new Error('CLOUD_DB_URL is required in production');
  try { return normalizeDB(JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))); } catch (error) { if (error.code === 'ENOENT') return emptyDB(); throw error; }
}
export async function saveDB(data) {
  const payload = normalizeDB(data);
  if (CLOUD_DB_URL) { if (!CLOUD_DB_TOKEN) throw new Error('CLOUD_DB_TOKEN is required when CLOUD_DB_URL is configured'); const res = await fetch(CLOUD_DB_URL, { method: 'PUT', headers: storageHeaders(), body: JSON.stringify(payload) }); if (!res.ok) throw new Error(`Database write failed (${res.status})`); return; }
  if (process.env.VERCEL) throw new Error('CLOUD_DB_URL is required in production');
  fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2));
}
function secret(name) { const value = process.env[name]; if (!value || value.length < 32) throw new Error(`${name} must be configured with at least 32 random characters`); return value; }
const b64url = value => Buffer.from(value).toString('base64url');
const decode = value => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
export function issueToken(kind, subject, ttlMs) { const payload = { kind, subject, exp: Date.now() + ttlMs, nonce: crypto.randomBytes(16).toString('base64url') }; const encoded = b64url(JSON.stringify(payload)); const signature = crypto.createHmac('sha256', secret(kind === 'admin' ? 'ADMIN_SECRET' : 'TEAM_TOKEN_SECRET')).update(encoded).digest('base64url'); return `${encoded}.${signature}`; }
export function verifyToken(token, kind) { if (typeof token !== 'string') return null; const [encoded, signature] = token.split('.'); if (!encoded || !signature) return null; const expected = crypto.createHmac('sha256', secret(kind === 'admin' ? 'ADMIN_SECRET' : 'TEAM_TOKEN_SECRET')).update(encoded).digest('base64url'); const actual = Buffer.from(signature); const expectedBuffer = Buffer.from(expected); if (actual.length !== expectedBuffer.length || !crypto.timingSafeEqual(actual, expectedBuffer)) return null; try { const payload = decode(encoded); return payload.kind === kind && typeof payload.subject === 'string' && payload.exp > Date.now() ? payload : null; } catch { return null; } }
export function adminPasscodeMatches(value) { if (typeof value !== 'string') return false; const configured = secret('ADMIN_SECRET'); const supplied = Buffer.from(value); const expected = Buffer.from(configured); return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected); }
export function bearer(req) { return (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim(); }
export function requireAdmin(req, res) { const token = verifyToken(bearer(req), 'admin'); if (!token) { res.status(401).json({ error: 'Unauthorized' }); return null; } return token; }
export function requireTeam(req, res, teamName) { const token = verifyToken(bearer(req), 'team'); if (!token || token.subject !== teamName) { res.status(401).json({ error: 'Invalid team session' }); return null; } return token; }
export function getBody(req) { if (req.body && typeof req.body === 'object') return req.body; if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } } return {}; }
export function validTeamName(value) { if (typeof value !== 'string') return null; const name = value.trim(); return name.length >= 2 && name.length <= 30 && !/^[=+\-@\t\r]/.test(name) && !['__proto__', 'prototype', 'constructor'].includes(name) ? name : null; }
export function isKicked(db, teamName) { return db.kickedTeams.some(entry => (typeof entry === 'object' ? entry.teamName : entry) === teamName); }
