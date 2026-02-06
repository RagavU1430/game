'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [gameResult, setGameResult] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate particles only on the client
    const newParticles = [...Array(70)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${3 + Math.random() * 5}s`,
      delay: `${Math.random() * 5}s`
    }));
    setParticles(newParticles);

    const completed = localStorage.getItem('gameCompleted');
    if (completed === 'true') {
      setGameResult({
        score: localStorage.getItem('lastGameScore'),
        time: localStorage.getItem('lastGameTime')
      });
    }

    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="landing-wrapper">
      {/* CURSOR GLOW */}
      <div
        className="cursor-glow"
        style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
      ></div>

      {/* PARTICLES */}
      <div className="particles">
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              left: p.left,
              animationDuration: p.duration,
              animationDelay: p.delay
            }}
          ></span>
        ))}
      </div>

      <header>
        <div className="college-logo">
          <img src="/gh.png" alt="College Logo" />
        </div>
        <div className="college-title">
          <h1>VSB ENGINEERING COLLEGE</h1>
          <span>AN AUTONOMOUS INSTITUTION</span>
        </div>
        <div className="robotics-logo">
          <img src="/robotic logo.jpeg" alt="Robotics Logo" />
        </div>
      </header>

      <main>
        <div className="department">
          DEPARTMENT OF ARTIFICIAL INTELLIGENCE AND DATA SCIENCE AND MECHANICAL
        </div>

        <div className="club-text">ROBOTICS CLUB</div>
        <div className="organizes-text">ORGANIZES</div>

        <div className="gameflow-logo">
          <img src="/logo.png" alt="Game Flow Logo" />
        </div>

        <div id="experience-container">
          {gameResult ? (
            <div className="result-card">
              <h2>EXPERIENCE COMPLETE!</h2>
              <p>Final Score: <span>{gameResult.score}</span></p>
              <p>Completion Time: <span>{gameResult.time}</span></p>
              <button className="start-btn" onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}>RESTART EXPERIENCE ↺</button>
            </div>
          ) : (
            <Link href="/role-selection">
              <button className="start-btn">START EXPERIENCE →</button>
            </Link>
          )}
        </div>
      </main>

      <style jsx>{`
                .landing-wrapper {
                    height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                    background: #020b18;
                }

                .landing-wrapper::before {
                    content: "";
                    position: fixed;
                    inset: -40%;
                    background: radial-gradient(circle at center, rgba(0, 255, 255, 0.18), transparent 60%);
                    animation: waveMove 14s ease-in-out infinite alternate;
                    z-index: 0;
                }

                @keyframes waveMove {
                    from { transform: translate(-12%, -12%); }
                    to { transform: translate(12%, 12%); }
                }

                .cursor-glow {
                    position: fixed;
                    width: 350px;
                    height: 350px;
                    border-radius: 50%;
                    pointer-events: none;
                    background: radial-gradient(circle, rgba(0, 255, 255, 0.35), transparent 65%);
                    transform: translate(-50%, -50%);
                    z-index: 1;
                    transition: transform 0.05s linear;
                }

                .particles {
                    position: fixed;
                    inset: 0;
                    pointer-events: none;
                    z-index: 1;
                }

                .particles span {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    background: #00ffff;
                    opacity: 0.8;
                    animation: float 6s linear infinite;
                }

                @keyframes float {
                    from { transform: translateY(110vh); }
                    to { transform: translateY(-10vh); }
                }

                header {
                    position: absolute;
                    top: 20px;
                    left: 30px;
                    right: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    z-index: 10;
                }

                .college-logo img {
                    width: 80px;
                    filter: drop-shadow(0 0 12px cyan);
                }

                .robotics-logo img {
                    width: 120px;
                    filter: drop-shadow(0 0 12px cyan);
                }

                .college-title {
                    text-align: center;
                    flex-grow: 1;
                }

                .college-title h1 {
                    font-size: 28px;
                    letter-spacing: 2px;
                    color: #00ffff;
                    text-shadow: 0 0 18px cyan;
                }

                .college-title span {
                    display: inline-block;
                    margin-top: 6px;
                    padding: 6px 16px;
                    font-size: 12px;
                    border-radius: 20px;
                    border: 1px solid cyan;
                    color: cyan;
                }

                main {
                    text-align: center;
                    margin-top: 140px;
                    z-index: 10;
                }

                .department {
                    position: absolute;
                    top: 120px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 12px 36px;
                    border-radius: 30px;
                    background: rgba(0, 255, 255, 0.15);
                    border: 1px solid cyan;
                    box-shadow: 0 0 25px cyan;
                    white-space: nowrap;
                }

                .club-text {
                    margin-top: 50px;
                    font-size: 32px;
                    font-weight: 900;
                    letter-spacing: 4px;
                    text-shadow: 0 0 22px cyan;
                }

                .organizes-text {
                    font-size: 16px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    margin-bottom: 35px;
                    color: #b8faff;
                }

                .gameflow-logo img {
                    width: 320px;
                    max-width: 90%;
                    margin-bottom: 45px;
                    filter: drop-shadow(0 0 30px cyan);
                    border-radius: 20px;
                }

                .start-btn {
                    padding: 14px 40px;
                    font-size: 16px;
                    font-weight: 700;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    color: #000;
                    background: linear-gradient(135deg, #00ffff, #00aaff);
                    box-shadow: 0 0 30px cyan;
                    transition: 0.3s;
                }

                .start-btn:hover {
                    transform: scale(1.08);
                    box-shadow: 0 0 45px cyan;
                }

                .result-card {
                    background: rgba(0, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 15px;
                    border: 1px solid cyan;
                    box-shadow: 0 0 20px cyan;
                    margin-bottom: 20px;
                }

                .result-card h2 {
                    color: #00ffff;
                    margin-bottom: 10px;
                    font-size: 24px;
                    text-shadow: 0 0 10px cyan;
                }

                .result-card p {
                    font-size: 18px;
                    color: #fff;
                    margin: 5px 0;
                }

                .result-card span {
                    font-weight: bold;
                    color: #00ffff;
                }
            `}</style>
    </div>
  );
}
