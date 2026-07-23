import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaTrophy, FaClock, FaUsers, FaCircleCheck } from 'react-icons/fa6';
import FloatingBackground from '../components/FloatingBackground';
import questions from '../data/questions.json';

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  const millis = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${mins}:${secs}:${millis}`;
}

export default function Result({ score, totalTime = 0, teamName = '', onAutoReturnHome }) {
  const [countdown, setCountdown] = useState(5);

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
            <strong>{score} <i>/ {questions.length}</i></strong>
          </div>

          <div className="result-time">
            <FaClock />
            <span>Total Time: <strong>{formatTime(totalTime)}</strong></span>
          </div>

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
