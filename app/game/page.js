'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const LEVEL_QUESTIONS = {
    1: [
        { question: "Robot", answer: "Robot" },
        { question: "Sensor", answer: "Sensor" },
        { question: "Actuator", answer: "Actuator" },
        { question: "Automation", answer: "Automation" },
        { question: "Machine", answer: "Machine" },
        { question: "Motor", answer: "Motor" },
        { question: "Gear", answer: "Gear" },
        { question: "Circuit", answer: "Circuit" },
        { question: "Processor", answer: "Processor" },
        { question: "Mechanism", answer: "Mechanism" }
    ],
    2: [
        { question: "Learning", answer: "Learning" }, { question: "Dataset", answer: "Dataset" }, { question: "Neural", answer: "Neural" },
        { question: "Prediction", answer: "Prediction" }, { question: "Training", answer: "Training" }, { question: "Model", answer: "Model" },
        { question: "Vision", answer: "Vision" }, { question: "Language", answer: "Language" }, { question: "Optimization", answer: "Optimization" }, { question: "Data", answer: "Data" }
    ],
    3: [
        { question: "Algorithm", answer: "Algorithm" }, { question: "Computation", answer: "Computation" }, { question: "Simulation", answer: "Simulation" },
        { question: "Analysis", answer: "Analysis" }, { question: "Calibration", answer: "Calibration" }, { question: "Iteration", answer: "Iteration" },
        { question: "Processing", answer: "Processing" }, { question: "Execution", answer: "Execution" }, { question: "Control", answer: "Control" }, { question: "Code", answer: "Code" }
    ],
    4: [
        { question: "Hydraulics", answer: "Hydraulics" }, { question: "Pneumatics", answer: "Pneumatics" }, { question: "Torque", answer: "Torque" },
        { question: "Velocity", answer: "Velocity" }, { question: "Friction", answer: "Friction" }, { question: "Stress", answer: "Stress" },
        { question: "Strain", answer: "Strain" }, { question: "Gravity", answer: "Gravity" }, { question: "Motion", answer: "Motion" }, { question: "Physics", answer: "Physics" }
    ],
    5: [
        { question: "Robotics", answer: "Robotics" }, { question: "Mechatronics", answer: "Mechatronics" }, { question: "Autonomous", answer: "Autonomous" },
        { question: "Cybernetics", answer: "Cybernetics" }, { question: "Nano", answer: "Nano" }, { question: "Innovation", answer: "Innovation" },
        { question: "Intelligence", answer: "Intelligence" }, { question: "Future", answer: "Future" }, { question: "Design", answer: "Design" }, { question: "System", answer: "System" }
    ]
};

const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

export default function GamePage() {
    const router = useRouter();
    const [gameState, setGameState] = useState({
        level: 1,
        score: 0,
        timeRemaining: 1200,
        playerName: '',
        isRegistered: false,
        isStartedByHost: false,
        isCompleted: false,
        tiles: [],
        flipped: [],
        matched: [],
        canFlip: true,
        startTime: null
    });

    const wsRef = useRef(null);
    const timerRef = useRef(null);
    const gameStateRef = useRef(gameState);

    // Keep ref in sync with state
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Initial check for game status with WebSocket connection
    useEffect(() => {
        let ws = null;
        let reconnectTimeout = null;
        let isComponentMounted = true;

        const connectWebSocket = () => {
            if (!isComponentMounted) return;

            try {
                const hostname = window.location.hostname;
                ws = new WebSocket(`ws://${hostname}:5000`);

                ws.onopen = () => {
                    console.log('✅ Connected to server');
                };

                ws.onmessage = (event) => {
                    const message = JSON.parse(event.data);
                    if (message.type === 'game-started' || (message.type === 'initial' && message.gameStarted)) {
                        setGameState(prev => ({ ...prev, isStartedByHost: true }));
                    }
                    if (message.type === 'reset') {
                        window.location.reload();
                    }
                };

                ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                };

                ws.onclose = () => {
                    console.log('🔌 Disconnected from server. Reconnecting...');
                    if (isComponentMounted) {
                        reconnectTimeout = setTimeout(connectWebSocket, 2000);
                    }
                };

                wsRef.current = ws;
            } catch (error) {
                console.error('Failed to connect:', error);
                if (isComponentMounted) {
                    reconnectTimeout = setTimeout(connectWebSocket, 2000);
                }
            }
        };

        // Initial status check
        const checkStatus = async () => {
            try {
                const hostname = window.location.hostname;
                const res = await fetch(`http://${hostname}:5000/api/game-status`);
                const data = await res.json();
                if (data.gameStarted) setGameState(prev => ({ ...prev, isStartedByHost: true }));
            } catch (e) {
                console.error('⚠️ Server not reachable. Make sure server is running on port 5000');
            }
        };

        checkStatus();
        connectWebSocket();

        return () => {
            isComponentMounted = false;
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
            if (ws) ws.close();
        };
    }, []);

    // Visibility detection - using ref to avoid recreating listener
    useEffect(() => {
        const handleVisibility = () => {
            const currentState = gameStateRef.current;
            if (currentState.isRegistered && currentState.isStartedByHost && document.hidden) {
                const hostname = window.location.hostname;
                fetch(`http://${hostname}:5000/api/report-violation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerName: currentState.playerName, violationType: 'tab-switch' })
                }).catch(err => console.error('Failed to report violation:', err));
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []); // Empty dependency array - listener only created once

    const generateTiles = useCallback((level) => {
        const pairs = LEVEL_QUESTIONS[level];
        const tiles = [];
        pairs.forEach((pair, index) => {
            tiles.push({ id: `q-${index}`, text: pair.question, type: 'question', pairId: index });
            tiles.push({ id: `a-${index}`, text: pair.answer, type: 'answer', pairId: index });
        });
        return shuffleArray(tiles);
    }, []);

    const register = async (name) => {
        if (!name.trim()) return;
        try {
            const hostname = window.location.hostname;
            const res = await fetch(`http://${hostname}:5000/api/register-participant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: name })
            });
            const data = await res.json();
            setGameState(prev => ({
                ...prev,
                playerName: name,
                isRegistered: true,
                isStartedByHost: data.gameStarted,
                tiles: generateTiles(1),
                startTime: Date.now()
            }));
        } catch (e) { alert('Server unavailable'); }
    };

    const handleTileClick = (tile) => {
        if (!gameState.canFlip || !gameState.isStartedByHost || gameState.flipped.find(f => f.id === tile.id) || gameState.matched.includes(tile.pairId)) return;

        const newFlipped = [...gameState.flipped, tile];
        setGameState(prev => ({ ...prev, flipped: newFlipped }));

        if (newFlipped.length === 2) {
            setGameState(prev => ({ ...prev, canFlip: false }));
            setTimeout(() => {
                const [t1, t2] = newFlipped;
                if (t1.pairId === t2.pairId && t1.type !== t2.type) {
                    const newMatched = [...gameState.matched, t1.pairId];
                    const newScore = gameState.score + 10;
                    if (newMatched.length === 10) {
                        if (gameState.level === 5) {
                            completeGame(newScore);
                        } else {
                            setTimeout(() => {
                                setGameState(prev => ({
                                    ...prev,
                                    level: prev.level + 1,
                                    score: newScore,
                                    matched: [],
                                    tiles: generateTiles(prev.level + 1),
                                    canFlip: true,
                                    flipped: []
                                }));
                            }, 500);
                        }
                    } else {
                        setGameState(prev => ({ ...prev, matched: newMatched, score: newScore, flipped: [], canFlip: true }));
                    }
                } else {
                    setGameState(prev => ({ ...prev, flipped: [], canFlip: true }));
                }
            }, 600);
        }
    };

    const completeGame = async (finalBaseScore) => {
        const timeTaken = Math.floor((Date.now() - gameState.startTime) / 1000);

        try {
            const hostname = window.location.hostname;
            await fetch(`http://${hostname}:5000/api/submit-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName: gameState.playerName,
                    score: finalBaseScore,
                    timeTaken,
                    level: 5
                })
            });
        } catch (e) { console.error('Submit failed'); }

        // Local storage for landing page results
        const minutes = timeTaken / 60;
        const timeBonus = Math.max(0, 500 - (minutes * 25));
        const total = Math.min(1000, Math.max(0, finalBaseScore + Math.round(timeBonus)));

        localStorage.setItem('gameCompleted', 'true');
        localStorage.setItem('lastGameScore', total);
        localStorage.setItem('lastGameTime', `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`);

        setGameState(prev => ({ ...prev, isCompleted: true, score: finalBaseScore }));
        setTimeout(() => router.push('/'), 4000);
    };

    useEffect(() => {
        if (gameState.isRegistered && gameState.isStartedByHost && !gameState.isCompleted) {
            timerRef.current = setInterval(() => {
                setGameState(prev => ({ ...prev, timeRemaining: prev.timeRemaining > 0 ? prev.timeRemaining - 1 : 0 }));
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState.isRegistered, gameState.isStartedByHost, gameState.isCompleted]);

    if (!gameState.isRegistered) {
        return (
            <div className="setup-container">
                <div className="card">
                    <h1>WELCOME TO GAME FLOW</h1>
                    <p>Enter your name to register for the session</p>
                    <input type="text" id="name-in" placeholder="Full Name" onKeyDown={e => e.key === 'Enter' && register(e.target.value)} autoFocus />
                    <button onClick={() => register(document.getElementById('name-in').value)}>JOIN SESSION</button>
                </div>
                <style jsx>{`
                    .setup-container { height: 100vh; background: #020b18; display: flex; align-items: center; justify-content: center; color: #fff; font-family: 'Outfit', sans-serif; }
                    .card { background: rgba(255, 255, 255, 0.05); padding: 3rem; border-radius: 20px; border: 1px solid rgba(0, 255, 255, 0.2); text-align: center; box-shadow: 0 0 40px rgba(0, 255, 255, 0.1); }
                    h1 { font-size: 2rem; margin-bottom: 1rem; color: #00ffff; }
                    input { display: block; width: 100%; padding: 1rem; margin: 1.5rem 0; background: rgba(255, 255, 255, 0.1); border: 1px solid cyan; border-radius: 10px; color: #fff; outline: none; }
                    button { width: 100%; padding: 1rem; background: cyan; color: #000; font-weight: 900; border: none; border-radius: 10px; cursor: pointer; }
                `}</style>
            </div>
        );
    }

    if (!gameState.isStartedByHost) {
        return (
            <div className="waiting-container">
                <div className="loader"></div>
                <h2>WAITING FOR HOST TO START...</h2>
                <p>Registered as: <strong>{gameState.playerName}</strong></p>
                <style jsx>{`
                    .waiting-container { height: 100vh; background: #020b18; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-family: 'Outfit', sans-serif; }
                    .loader { width: 60px; height: 60px; border: 4px solid rgba(0, 255, 255, 0.1); border-top: 4px solid #00ffff; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 2rem; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                    h2 { letter-spacing: 2px; color: #00ffff; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="game-wrapper">
            {gameState.isCompleted && (
                <div className="completion-overlay">
                    <h1>🏁 MISSION COMPLETE!</h1>
                    <p>Sending score to leaderboard...</p>
                </div>
            )}

            <header className="game-status">
                <div className="stat">LEVEL <span>{gameState.level} / 5</span></div>
                <div className="stat">SCORE <span>{gameState.score}</span></div>
                <div className="stat time">TIME <span>{Math.floor(gameState.timeRemaining / 60)}:{(gameState.timeRemaining % 60).toString().padStart(2, '0')}</span></div>
            </header>

            <div className="grid">
                {gameState.tiles.map(tile => {
                    const flipped = gameState.flipped.find(f => f.id === tile.id) || gameState.matched.includes(tile.pairId);
                    const matched = gameState.matched.includes(tile.pairId);
                    return (
                        <div key={tile.id} className={`tile ${flipped ? 'flipped' : ''} ${matched ? 'matched' : ''}`} onClick={() => handleTileClick(tile)}>
                            <div className="inner">
                                <div className="front">?</div>
                                <div className="back">{tile.text}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .game-wrapper { min-height: 100vh; background: #020b18; padding: 2rem; color: #fff; font-family: 'Outfit', sans-serif; }
                .game-status { display: flex; justify-content: center; gap: 4rem; background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 3rem; }
                .stat { font-size: 0.9rem; color: #888; }
                .stat span { display: block; font-size: 1.5rem; font-weight: 900; color: #fff; }
                .time span { color: #00ffff; }
                .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; max-width: 800px; margin: 0 auto; }
                .tile { height: 110px; perspective: 1000px; cursor: pointer; transition: 0.3s; }
                .tile:hover { transform: scale(1.03); }
                .inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; }
                .tile.flipped .inner { transform: rotateY(180deg); }
                .tile.matched { opacity: 0; pointer-events: none; transition: 0.8s; }
                .front, .back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0,255,255,0.2); font-weight: bold; }
                .front { background: rgba(255,255,255,0.05); font-size: 2rem; color: rgba(0,255,255,0.3); }
                .back { background: #00ffff; color: #000; transform: rotateY(180deg); padding: 0.5rem; text-align: center; font-size: 0.9rem; }
                .completion-overlay { position: fixed; inset: 0; background: #020b18; z-index: 1000; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .completion-overlay h1 { font-size: 3rem; text-shadow: 0 0 20px #00ffff; margin-bottom: 1rem; }
            `}</style>
        </div>
    );
}
