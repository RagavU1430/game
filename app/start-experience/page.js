'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StartExperience() {
    const router = useRouter();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="experience-wrapper">
            <div
                className="cursor-glow"
                style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
            ></div>

            <div className="content-container">
                <div className="logo-section">
                    <img src="/logo.png" alt="Game Flow Logo" className="floating-logo" />
                </div>

                <div className="welcome-section">
                    <h1 className="main-title">READY TO START?</h1>
                    <p className="subtitle">Welcome to the Game Flow experience. You're about to join a real-time matching challenge that tests your knowledge and speed.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-item">
                        <span className="icon">⚡</span>
                        <h3>Speed</h3>
                        <p>Complete levels faster for higher scores</p>
                    </div>
                    <div className="feature-item">
                        <span className="icon">🧠</span>
                        <h3>Logic</h3>
                        <p>Match concepts accurately to progress</p>
                    </div>
                    <div className="feature-item">
                        <span className="icon">🚫</span>
                        <h3>Focus</h3>
                        <p>Stay on tab - violations are recorded</p>
                    </div>
                </div>

                <div className="action-section">
                    <Link href="/game">
                        <button className="enter-btn">ENTER GAME FLOW →</button>
                    </Link>
                </div>
            </div>

            <style jsx>{`
                .experience-wrapper {
                    min-height: 100vh;
                    background: #020b18;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: #fff;
                    font-family: 'Outfit', sans-serif;
                    overflow: hidden;
                    position: relative;
                }

                .experience-wrapper::before {
                    content: "";
                    position: fixed;
                    inset: -50%;
                    background: radial-gradient(circle at center, rgba(0, 255, 255, 0.1), transparent 70%);
                    animation: pulse 8s ease-in-out infinite alternate;
                }

                @keyframes pulse {
                    from { transform: scale(1); opacity: 0.5; }
                    to { transform: scale(1.1); opacity: 0.8; }
                }

                .cursor-glow {
                    position: fixed;
                    width: 400px;
                    height: 400px;
                    border-radius: 50%;
                    pointer-events: none;
                    background: radial-gradient(circle, rgba(0, 255, 255, 0.2), transparent 70%);
                    transform: translate(-50%, -50%);
                    z-index: 1;
                }

                .content-container {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                    max-width: 800px;
                    padding: 2rem;
                }

                .floating-logo {
                    width: 280px;
                    margin-bottom: 2rem;
                    filter: drop-shadow(0 0 20px cyan);
                    animation: float 4s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }

                .main-title {
                    font-size: 4rem;
                    font-weight: 900;
                    letter-spacing: 6px;
                    color: #00ffff;
                    text-shadow: 0 0 30px cyan;
                    margin-bottom: 1rem;
                }

                .subtitle {
                    font-size: 1.2rem;
                    color: #a0aec0;
                    line-height: 1.6;
                    margin-bottom: 3rem;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2rem;
                    margin-bottom: 4rem;
                }

                .feature-item {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 2rem;
                    border-radius: 20px;
                    border: 1px solid rgba(0, 255, 255, 0.2);
                    transition: 0.3s;
                }

                .feature-item:hover {
                    transform: translateY(-10px);
                    background: rgba(0, 255, 255, 0.1);
                    border-color: cyan;
                }

                .icon {
                    font-size: 2.5rem;
                    display: block;
                    margin-bottom: 1rem;
                }

                .feature-item h3 {
                    color: #fff;
                    margin-bottom: 0.5rem;
                }

                .feature-item p {
                    font-size: 0.9rem;
                    color: #888;
                }

                .enter-btn {
                    padding: 1.2rem 4rem;
                    font-size: 1.2rem;
                    font-weight: 900;
                    background: linear-gradient(135deg, #00ffff, #00aaff);
                    border: none;
                    border-radius: 50px;
                    color: #000;
                    cursor: pointer;
                    box-shadow: 0 0 30px cyan;
                    transition: 0.4s;
                    letter-spacing: 2px;
                }

                .enter-btn:hover {
                    transform: scale(1.05) translateY(-5px);
                    box-shadow: 0 0 50px cyan;
                }
            `}</style>
        </div>
    );
}
