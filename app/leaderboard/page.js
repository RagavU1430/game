'use client';

import { useState, useEffect } from 'react';

export default function Leaderboard() {
    const [data, setData] = useState({
        leaderboard: [],
        participants: [],
        violations: [],
        connected: false
    });

    useEffect(() => {
        // Connect to WebSocket in production it should be dynamic
        const ws = new WebSocket('ws://localhost:5000');

        ws.onopen = () => setData(prev => ({ ...prev, connected: true }));
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'initial' || message.type === 'update') {
                setData(prev => ({
                    ...prev,
                    leaderboard: message.data,
                    participants: message.participants || [],
                    violations: message.violations || []
                }));
            }
        };

        return () => ws.close();
    }, []);

    return (
        <div className="leaderboard-wrapper">
            <h1>Host Dashboard</h1>
            <div className="stats">
                <div>Players: {data.leaderboard.length}</div>
                <div>Status: {data.connected ? 'Connected' : 'Disconnected'}</div>
            </div>

            <section className="leaderboard">
                <h2>Leaderboard</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Score</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.leaderboard.map((player, i) => (
                            <tr key={player.id}>
                                <td>{i + 1}</td>
                                <td>{player.playerName}</td>
                                <td>{player.score}</td>
                                <td>{player.timeTaken}s</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <style jsx>{`
                .leaderboard-wrapper {
                    min-height: 100vh;
                    background: #0f0c29;
                    padding: 2rem;
                    color: #fff;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 2rem;
                }
                th, td {
                    padding: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: left;
                }
            `}</style>
        </div>
    );
}
