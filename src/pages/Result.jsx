import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaTrophy, FaClock, FaUsers, FaCircleCheck } from 'react-icons/fa6';
import FloatingBackground from '../components/FloatingBackground';
import Button from '../components/Button';

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  const millis = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${mins}:${secs}:${millis}`;
}

export default function Result({ score, totalTime = 0, teamName = '', totalQuestions = 10, onAutoReturnHome, leaderboardRevealed = false, onOpenLeaderboard }) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onAutoReturnHome) onAutoReturnHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onAutoReturnHome]);

  return (
    <>
      <FloatingBackground />
      <section className="result-page">
        <motion.div
          className="result-card glass"
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="stars">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -11, 0], rotate: [0, 20, 0] }}
                transition={{ duration: 1.6, delay: i * 0.15, repeat: Infinity }}
              >
                <FaStar />
              </motion.span>
            ))}
          </div>

          <motion.div
            className="trophy"
            animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <FaTrophy />
          </motion.div>

          <p className="eyebrow">Event Submission Complete</p>
          <h1>Congratulations!</h1>
          
          {teamName && (
            <div className="result-team-badge">
              <FaUsers /> Team: <strong>{teamName}</strong>
            </div>
          )}

          <p>Great observation skills! Your results have been submitted.</p>

          <div className="result-score">
            <small>Your Final Score</small>
            <strong>{score} <i>/ {totalQuestions}</i></strong>
          </div>

          <div className="result-time">
            <FaClock />
            <span>Total Time: <strong>{formatTime(totalTime)}</strong></span>
          </div>

          {leaderboardRevealed ? (
            <div style={{ margin: '1rem 0' }}>
              <Button onClick={onOpenLeaderboard} className="reveal-banner-btn" style={{ width: '100%' }}>
                <FaTrophy /> 🎉 View Final Event Leaderboard
              </Button>
            </div>
          ) : (
            <div className="waiting-host-reveal-banner glass" style={{ margin: '1rem 0', padding: '0.9rem 1.2rem', borderRadius: '16px', background: 'rgba(254, 243, 199, 0.4)', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                ⏳ Waiting for Host to Reveal Final Leaderboard…
              </p>
              <small style={{ fontSize: '0.8rem', color: '#78350f', display: 'block', marginTop: '0.2rem' }}>
                The host will release final ranks and podium soon!
              </small>
            </div>
          )}

          <div className="completion-banner">
            <FaCircleCheck className="check-icon" />
            <div>
              <strong>Recorded on Live Leaderboard</strong>
              <p>Your team's score and time are registered. Returning to Home in <b>{countdown}s</b>...</p>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}
