import { ADMIN_SECRET, generateToken } from '../_store.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { passcode } = req.body || {};

  if (passcode === ADMIN_SECRET) {
    const token = generateToken(passcode);
    return res.status(200).json({ success: true, token });
  }

  res.status(401).json({ success: false, error: 'Invalid passcode' });
}
