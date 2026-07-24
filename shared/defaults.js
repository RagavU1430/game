// Single source of truth for default questions
// Used by vite.config.js dev server and api/_store.js
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

// Client-safe version (no answers exposed)
export const CLIENT_QUESTIONS = DEFAULT_QUESTIONS.map(({ answer, ...rest }) => rest);

// Admin password - only used server-side, never sent to client
export const ADMIN_SECRET = 'admin123';

// Simple token generation (hash-like for session)
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

  // Re-verify hash signature
  const raw = `${pin}_${timestamp}_quiz_session`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const expectedHashStr = Math.abs(hash).toString(36);

  return hashStr === expectedHashStr;
}
