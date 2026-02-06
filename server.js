const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

let leaderboard = [];
let participants = [];
let violations = [];
let gameStarted = false;

const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);

    // Send initial state
    ws.send(JSON.stringify({
        type: 'initial',
        data: leaderboard,
        participants: participants,
        violations: violations,
        gameStarted: gameStarted
    }));

    ws.on('close', () => clients.delete(ws));
});

function broadcast(message) {
    const payload = JSON.stringify(message);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// Host controls
app.post('/api/start-game', (req, res) => {
    gameStarted = true;
    broadcast({ type: 'game-started' });
    res.json({ success: true });
});

app.post('/api/reset-game', (req, res) => {
    gameStarted = false;
    leaderboard = [];
    participants = [];
    violations = [];
    broadcast({ type: 'reset', gameStarted: false });
    res.json({ success: true });
});

// Participant endpoints
app.post('/api/register-participant', (req, res) => {
    const { playerName } = req.body;
    if (!participants.find(p => p.playerName === playerName)) {
        participants.push({ playerName, joinedAt: new Date() });
        broadcast({ type: 'update', participants, data: leaderboard, violations });
    }
    res.json({ success: true, gameStarted });
});

app.post('/api/submit-score', (req, res) => {
    const { playerName, score, timeTaken, level } = req.body;

    // Time-based marking (Max 1000)
    const minutesTaken = timeTaken / 60;
    const timeBonus = Math.max(0, 500 - (minutesTaken * 25));
    const finalScore = Math.min(1000, Math.max(0, parseInt(score) + Math.round(timeBonus)));

    leaderboard.push({
        id: Date.now(),
        playerName,
        score: finalScore,
        timeTaken,
        level,
        timestamp: new Date()
    });

    leaderboard.sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken);
    participants = participants.filter(p => p.playerName !== playerName);
    violations = violations.filter(v => v.playerName !== playerName);

    broadcast({ type: 'update', data: leaderboard, participants, violations });
    res.json({ success: true });
});

app.post('/api/report-violation', (req, res) => {
    const { playerName, violationType } = req.body;
    violations.push({ playerName, violationType, timestamp: new Date() });

    if (violationType === 'tab-switch') {
        const p = participants.find(p => p.playerName === playerName);
        if (p) p.disqualified = true;
    }

    broadcast({ type: 'update', data: leaderboard, participants, violations });
    res.json({ success: true });
});

app.get('/api/game-status', (req, res) => {
    res.json({ gameStarted });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
