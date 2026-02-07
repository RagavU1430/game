'use client';

import { useState, useEffect } from 'react';

export default function Leaderboard() {
    const [data, setData] = useState({
        leaderboard: [],
        participants: [],
        violations: [],
        gameStarted: false,
        connected: false
    });
    const [notifications, setNotifications] = useState([]);

    const addNotification = (msg) => {
        const id = Date.now();
        setNotifications(prev => [{ id, msg }, ...prev].slice(0, 5));
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    useEffect(() => {
        let ws = null;
        let reconnectTimeout = null;
        let isComponentMounted = true;

        const connectWebSocket = () => {
            if (!isComponentMounted) return;

            try {
                const hostname = window.location.hostname;
                ws = new WebSocket(`ws://${hostname}:8080`);

                ws.onopen = () => {
                    console.log('✅ Leaderboard connected to server');
                    setData(prev => ({ ...prev, connected: true }));
                };

                ws.onmessage = (event) => {
                    const message = JSON.parse(event.data);
                    if (message.type === 'initial' || message.type === 'update') {
                        // Check for new violations to notify
                        if (message.type === 'update' && message.violations?.length > data.violations.length) {
                            const newViolation = message.violations[message.violations.length - 1];
                            addNotification(`🚨 ${newViolation.playerName} switched tabs!`);
                        }

                        setData(prev => ({
                            ...prev,
                            leaderboard: message.data || [],
                            participants: message.participants || [],
                            violations: message.violations || [],
                            gameStarted: message.gameStarted ?? prev.gameStarted
                        }));
                    } else if (message.type === 'game-started') {
                        setData(prev => ({ ...prev, gameStarted: true }));
                    } else if (message.type === 'reset') {
                        setData(prev => ({ ...prev, gameStarted: false, leaderboard: [], participants: [], violations: [] }));
                    }
                };

                ws.onerror = (error) => {
                    // Only log if we had a successful connection before
                    if (ws.readyState === WebSocket.OPEN) {
                        console.error('❌ WebSocket error:', error);
                    }
                    setData(prev => ({ ...prev, connected: false }));
                };

                ws.onclose = () => {
                    console.log('🔌 Disconnected from server. Reconnecting...');
                    setData(prev => ({ ...prev, connected: false }));
                    if (isComponentMounted) {
                        reconnectTimeout = setTimeout(connectWebSocket, 2000);
                    }
                };
            } catch (error) {
                console.log('⚠️ Retrying connection...');
                setData(prev => ({ ...prev, connected: false }));
                if (isComponentMounted) {
                    reconnectTimeout = setTimeout(connectWebSocket, 2000);
                }
            }
        };

        connectWebSocket();

        return () => {
            isComponentMounted = false;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (ws) ws.close();
        };
    }, []);

    const startGame = async () => {
        try {
            const hostname = window.location.hostname;
            await fetch(`http://${hostname}:8080/api/start-game`, { method: 'POST' });
        } catch (e) {
            alert('Error starting game');
        }
    };

    const resetGame = async () => {
        if (confirm('Are you sure you want to reset all game data?')) {
            const hostname = window.location.hostname;
            await fetch(`http://${hostname}:8080/api/reset-game`, { method: 'POST' });
        }
    };

    return (
        <div className="dashboard-container">
            {/* Notification Popups */}
            <div className="notification-toast-container">
                {notifications.map(n => (
                    <div key={n.id} className="toast">
                        {n.msg}
                    </div>
                ))}
            </div>

            <header className="header">
                <h1 className="title">🎮 HOST DASHBOARD</h1>
                <div className="status">
                    <span className={`status-dot ${data.connected ? 'connected' : ''}`}></span>
                    {data.connected ? 'LIVE' : 'DISCONNECTED'}
                </div>
            </header>

            <div className="controls">
                {!data.gameStarted ? (
                    <button className="start-btn pulse" onClick={startGame}>START GLOBAL GAME 🚀</button>
                ) : (
                    <div className="active-tag">GAME IN PROGRESS ⏳</div>
                )}
                <button className="reset-btn" onClick={resetGame}>RESET ALL DATA</button>
            </div>

            <div className="grid-layout">
                {/* Stats Section */}
                <div className="stats-panel">
                    <div className="stat-card">
                        <span className="stat-label">Total Participants</span>
                        <span className="stat-value">{data.participants.length}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Violations</span>
                        <span className="stat-value" style={{ color: '#ff4757' }}>{data.violations.length}</span>
                    </div>
                </div>

                {/* Main Leaderboard */}
                <div className="leaderboard-section">
                    <h2>🏆 LEADERBOARD</h2>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player Name</th>
                                    <th>Points</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.leaderboard.length === 0 ? (
                                    <tr><td colSpan="4" className="empty">Waiting for submissions...</td></tr>
                                ) : (
                                    data.leaderboard.map((player, i) => (
                                        <tr key={player.id} className={i < 3 ? `top-${i + 1}` : ''}>
                                            <td className="rank">#{i + 1}</td>
                                            <td className="name">{player.playerName}</td>
                                            <td className="points">{player.score}</td>
                                            <td className="time">{player.timeTaken}s</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Active Player List */}
                <div className="participants-section">
                    <h2>👥 ACTIVE PLAYERS</h2>
                    <div className="player-list">
                        {data.participants.length === 0 ? (
                            <p className="empty">No players registered yet</p>
                        ) : (
                            data.participants.map((p, i) => (
                                <div key={i} className={`player-row ${p.disqualified ? 'disqualified' : ''}`}>
                                    <span>{p.playerName}</span>
                                    <span className="p-status">{p.disqualified ? '⚠️ DISQUALIFIED' : '🎮 PLAYING'}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .dashboard-container {
                    min-height: 100vh;
                    background: #020b18;
                    color: #fff;
                    padding: 2rem;
                    font-family: 'Outfit', sans-serif;
                    position: relative;
                }
                .notification-toast-container {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .toast {
                    background: #ff4757;
                    color: white;
                    padding: 1rem 2rem;
                    border-radius: 10px;
                    font-weight: bold;
                    box-shadow: 0 5px 15px rgba(255, 71, 87, 0.4);
                    animation: slideIn 0.3s ease-out;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid rgba(0, 255, 255, 0.1);
                    padding-bottom: 1rem;
                    margin-bottom: 2rem;
                }
                .title {
                    font-size: 2.5rem;
                    background: linear-gradient(135deg, #00ffff, #0088ff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .status {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: bold;
                    letter-spacing: 1px;
                }
                .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #ff4757;
                }
                .status-dot.connected {
                    background: #2ed573;
                    box-shadow: 0 0 10px #2ed573;
                }
                .controls {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .start-btn {
                    padding: 1rem 2rem;
                    background: #00ffff;
                    color: #000;
                    border: none;
                    border-radius: 12px;
                    font-weight: 900;
                    cursor: pointer;
                    transition: 0.3s;
                }
                .pulse {
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.4); }
                    70% { box-shadow: 0 0 0 20px rgba(0, 255, 255, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0); }
                }
                .reset-btn {
                    padding: 1rem 2rem;
                    background: rgba(255, 71, 87, 0.1);
                    color: #ff4757;
                    border: 1px solid #ff4757;
                    border-radius: 12px;
                    font-weight: bold;
                    cursor: pointer;
                }
                .active-tag {
                    padding: 1rem 2rem;
                    background: rgba(0, 255, 255, 0.1);
                    color: #00ffff;
                    border: 1px solid #00ffff;
                    border-radius: 12px;
                    font-weight: bold;
                }
                .grid-layout {
                    display: grid;
                    grid-template-columns: 250px 1fr 300px;
                    gap: 2rem;
                }
                .stats-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .stat-card {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1.5rem;
                    border-radius: 15px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .stat-label {
                    display: block;
                    font-size: 0.9rem;
                    color: #888;
                    margin-bottom: 0.5rem;
                }
                .stat-value {
                    font-size: 2rem;
                    font-weight: 900;
                }
                .table-container {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 20px;
                    padding: 1.5rem;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th {
                    text-align: left;
                    color: #888;
                    font-size: 0.8rem;
                    padding-bottom: 1rem;
                }
                td {
                    padding: 1.2rem 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .rank { color: #00ffff; font-weight: bold; font-size: 1.2rem; }
                .points { font-weight: bold; color: #fff; }
                .top-1 .rank { color: #ffd700; }
                .top-2 .rank { color: #c0c0c0; }
                .top-3 .rank { color: #cd7f32; }
                .player-list {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1.5rem;
                    border-radius: 20px;
                    height: 500px;
                    overflow-y: auto;
                }
                .player-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.03);
                    margin-bottom: 0.5rem;
                    border-radius: 10px;
                    font-size: 0.9rem;
                }
                .player-row.disqualified {
                    background: rgba(255, 71, 87, 0.1);
                    color: #ff4757;
                    text-decoration: line-through;
                }
                .p-status { font-size: 0.7rem; color: #2ed573; font-weight: bold; }
                .empty { text-align: center; color: #555; padding: 2rem; }
            `}</style>
        </div>
    );
}
