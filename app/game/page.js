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
        { question: "Learning", answer: "Learning" },
        { question: "Dataset", answer: "Dataset" },
        { question: "Neural", answer: "Neural" },
        { question: "Prediction", answer: "Prediction" },
        { question: "Training", answer: "Training" },
        { question: "Model", answer: "Model" },
        { question: "Recognition", answer: "Recognition" },
        { question: "Vision", answer: "Vision" },
        { question: "Language", answer: "Language" },
        { question: "Automation", answer: "Automation" }
    ],
    3: [
        { question: "Algorithm", answer: "Algorithm" },
        { question: "Computation", answer: "Computation" },
        { question: "Optimization", answer: "Optimization" },
        { question: "Simulation", answer: "Simulation" },
        { question: "Analysis", answer: "Analysis" },
        { question: "Calibration", answer: "Calibration" },
        { question: "Iteration", answer: "Iteration" },
        { question: "Processing", answer: "Processing" },
        { question: "Execution", answer: "Execution" },
        { question: "Control", answer: "Control" }
    ],
    4: [
        { question: "Hydraulics", answer: "Hydraulics" },
        { question: "Pneumatics", answer: "Pneumatics" },
        { question: "Thermodynamics", answer: "Thermodynamics" },
        { question: "Kinematics", answer: "Kinematics" },
        { question: "Dynamics", answer: "Dynamics" },
        { question: "Torque", answer: "Torque" },
        { question: "Velocity", answer: "Velocity" },
        { question: "Friction", answer: "Friction" },
        { question: "Stress", answer: "Stress" },
        { question: "Strain", answer: "Strain" }
    ],
    5: [
        { question: "Robotics", answer: "Robotics" },
        { question: "Mechatronics", answer: "Mechatronics" },
        { question: "Autonomous", answer: "Autonomous" },
        { question: "Cybernetics", answer: "Cybernetics" },
        { question: "Nanotechnology", answer: "Nanotechnology" },
        { question: "Biomimicry", answer: "Biomimicry" },
        { question: "Augmentation", answer: "Augmentation" },
        { question: "Digitization", answer: "Digitization" },
        { question: "Innovation", answer: "Innovation" },
        { question: "Intelligence", answer: "Intelligence" }
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
        isStarted: false,
        isCompleted: false,
        tiles: [],
        flipped: [],
        matched: [],
        canFlip: true,
        violationCount: 0,
        startTime: null
    });

    const timerRef = useRef(null);
    const wsRef = useRef(null);

    const generateTiles = useCallback((level) => {
        const pairs = LEVEL_QUESTIONS[level];
        const tiles = [];
        pairs.forEach((pair, index) => {
            tiles.push({ id: `q-${index}`, text: pair.question, type: 'question', pairId: index });
            tiles.push({ id: `a-${index}`, text: pair.answer, type: 'answer', pairId: index });
        });
        return shuffleArray(tiles);
    }, []);

    const startGame = async (name) => {
        if (!name.trim()) return;

        try {
            await fetch('http://localhost:5000/api/register-participant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName: name })
            });
        } catch (e) { console.error('Reg error:', e); }

        setGameState(prev => ({
            ...prev,
            playerName: name,
            isStarted: true,
            startTime: Date.now(),
            tiles: generateTiles(1)
        }));
    };

    const handleTileClick = (tile) => {
        if (!gameState.canFlip || gameState.flipped.find(f => f.id === tile.id) || gameState.matched.includes(tile.pairId)) return;

        const newFlipped = [...gameState.flipped, tile];
        setGameState(prev => ({ ...prev, flipped: newFlipped }));

        if (newFlipped.length === 2) {
            setGameState(prev => ({ ...prev, canFlip: false }));
            setTimeout(() => checkMatch(newFlipped), 800);
        }
    };

    const checkMatch = (flipped) => {
        const [t1, t2] = flipped;
        const isMatch = t1.pairId === t2.pairId && t1.type !== t2.type;

        if (isMatch) {
            const newMatched = [...gameState.matched, t1.pairId];
            const newScore = gameState.score + 10;

            setGameState(prev => ({
                ...prev,
                matched: newMatched,
                score: newScore,
                flipped: [],
                canFlip: true
            }));

            if (newMatched.length === 10) {
                if (gameState.level < 5) {
                    setTimeout(() => {
                        setGameState(prev => ({
                            ...prev,
                            level: prev.level + 1,
                            matched: [],
                            tiles: generateTiles(prev.level + 1)
                        }));
                    }, 1000);
                } else {
                    completeGame(newScore);
                }
            }
        } else {
            setGameState(prev => ({ ...prev, flipped: [], canFlip: true }));
        }
    };

    const completeGame = async (finalScore) => {
        const timeTaken = Math.floor((Date.now() - gameState.startTime) / 1000);

        // Mark allocation logic
        const minutesTaken = timeTaken / 60;
        const timeBonus = Math.max(0, 500 - (minutesTaken * 25));
        const totalScore = Math.min(1000, Math.max(0, finalScore + Math.round(timeBonus)));

        localStorage.setItem('gameCompleted', 'true');
        localStorage.setItem('lastGameScore', totalScore);
        localStorage.setItem('lastGameTime', `${Math.floor(timeTaken / 60)}:${(timeTaken % 60).toString().padStart(2, '0')}`);

        try {
            await fetch('http://localhost:5000/api/submit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName: gameState.playerName,
                    score: finalScore, // Base score
                    level: 5,
                    timeTaken: timeTaken
                })
            });
        } catch (e) { console.error('Submit error:', e); }

        setGameState(prev => ({ ...prev, isCompleted: true }));
        setTimeout(() => router.push('/'), 3000);
    };

    useEffect(() => {
        if (gameState.isStarted && !gameState.isCompleted) {
            timerRef.current = setInterval(() => {
                setGameState(prev => {
                    if (prev.timeRemaining <= 1) {
                        clearInterval(timerRef.current);
                        return { ...prev, timeRemaining: 0 };
                    }
                    return { ...prev, timeRemaining: prev.timeRemaining - 1 };
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState.isStarted, gameState.isCompleted]);

    return (
        <div className="game-wrapper">
            <div className="background-animation"></div>

            {!gameState.isStarted ? (
                <div className="modal active">
                    <div className="modal-content">
                        <h2>Welcome!</h2>
                        <input
                            type="text"
                            id="player-name-input"
                            placeholder="Enter Your Name"
                            onKeyDown={(e) => e.key === 'Enter' && startGame(e.target.value)}
                        />
                        <button className="start-btn" onClick={() => startGame(document.getElementById('player-name-input').value)}>
                            Start Game
                        </button>
                    </div>
                </div>
            ) : gameState.isCompleted ? (
                <div className="modal active">
                    <div className="modal-content">
                        <h1>🏆 Congratulations!</h1>
                        <p>You completed all levels!</p>
                        <p>Redirecting to landing page...</p>
                    </div>
                </div>
            ) : (
                <div className="game-container">
                    <header className="game-header">
                        <div className="info-panel">
                            <div className="info-card">Level: {gameState.level}</div>
                            <div className="info-card">Score: {gameState.score}</div>
                            <div className="info-card">
                                Time: {Math.floor(gameState.timeRemaining / 60)}:{(gameState.timeRemaining % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                    </header>

                    <div className="game-grid">
                        {gameState.tiles.map(tile => {
                            const isFlipped = gameState.flipped.find(f => f.id === tile.id);
                            const isMatched = gameState.matched.includes(tile.pairId);
                            return (
                                <div
                                    key={tile.id}
                                    className={`tile ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
                                    onClick={() => handleTileClick(tile)}
                                >
                                    <div className="tile-inner">
                                        <div className="tile-front"></div>
                                        <div className="tile-back">{tile.text}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style jsx>{`
                .game-wrapper {
                    min-height: 100vh;
                    background: #020b18;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: #fff;
                    position: relative;
                }
                .background-animation {
                    position: fixed;
                    inset: 0;
                    background: radial-gradient(circle at center, rgba(0, 255, 255, 0.05), transparent 70%);
                    z-index: 0;
                }
                .modal {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 100;
                }
                .modal-content {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 3rem;
                    border-radius: 20px;
                    border: 1px solid cyan;
                    text-align: center;
                    box-shadow: 0 0 30px cyan;
                }
                input {
                    display: block;
                    width: 100%;
                    padding: 1rem;
                    margin: 1rem 0;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid cyan;
                    color: #fff;
                    border-radius: 10px;
                }
                .start-btn {
                    padding: 0.8rem 2rem;
                    background: cyan;
                    color: #000;
                    border: none;
                    border-radius: 10px;
                    font-weight: 700;
                    cursor: pointer;
                }
                .game-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 1rem;
                    margin-top: 2rem;
                }
                .tile {
                    width: 120px;
                    height: 120px;
                    perspective: 1000px;
                    cursor: pointer;
                }
                .tile-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.6s;
                    transform-style: preserve-3d;
                }
                .tile.flipped .tile-inner {
                    transform: rotateY(180deg);
                }
                .tile.matched {
                   visibility: hidden;
                   opacity: 0;
                   transition: opacity 0.5s;
                }
                .tile-front, .tile-back {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    border: 1px solid cyan;
                }
                .tile-front {
                    background: rgba(255, 255, 255, 0.05);
                }
                .tile-back {
                    background: cyan;
                    color: #000;
                    transform: rotateY(180deg);
                }
                .info-panel {
                    display: flex;
                    gap: 2rem;
                    margin-bottom: 2rem;
                }
                .info-card {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 1rem;
                    border-radius: 10px;
                    border: 1px solid cyan;
                }
            `}</style>
        </div>
    );
}
