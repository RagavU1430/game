import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTrophy, FaMedal, FaStar, FaClock, FaMagnifyingGlass, FaXmark,
  FaCircleCheck, FaCrown
} from 'react-icons/fa6';

function formatTime(ms) {
  if (!ms && ms !== 0) return 'N/A';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  const millis = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${mins}:${secs}:${millis}`;
}

export default function CelebrationLeaderboardModal({ open, onClose, myTeamName = '', totalQuestions = 10 }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rank');
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef(null);

  // Fetch leaderboard data when opened
  useEffect(() => {
    if (!open) return;
    setIsLoading(true);

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.leaderboard)) {
            setLeaderboard(data.leaderboard);
            localStorage.setItem('quiz_leaderboard', JSON.stringify(data.leaderboard));
          }
        }
      } catch (e) {
        console.error('[CelebrationModal] Fetch error:', e.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Fallback local storage
    try {
      const local = JSON.parse(localStorage.getItem('quiz_leaderboard') || '[]');
      if (local.length > 0) setLeaderboard(local);
    } catch (e) {}

    fetchLeaderboard();
  }, [open]);

  // Canvas Confetti Cannon Effect
  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#facc15', '#06b6d4'];

    const confettiCount = 140;
    const particles = [];

    for (let i = 0; i < confettiCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.4 - height * 0.2,
        r: Math.random() * 8 + 4,
        d: Math.random() * confettiCount,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleIncremental: Math.random() * 0.07 + 0.05,
        tiltAngle: Math.random() * Math.PI,
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 3 + 2
      });
    }

    let angle = 0;

    function render() {
      ctx.clearRect(0, 0, width, height);
      angle += 0.01;

      particles.forEach((p, i) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(angle + p.d) + 1 + p.r / 2) * 0.8 + p.vy * 0.3;
        p.x += Math.sin(angle) * 1.5 + p.vx * 0.3;
        p.tilt = Math.sin(p.tiltAngle) * 15;

        if (p.y > height) {
          particles[i] = {
            ...p,
            x: Math.random() * width,
            y: -20,
            tilt: Math.floor(Math.random() * 10) - 10
          };
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [open]);

  if (!open) return null;

  // Process & sort leaderboard safely
  const sorted = [...leaderboard].sort((a, b) => {
    const scoreA = Number(a?.score) || 0;
    const scoreB = Number(b?.score) || 0;
    const timeA = Number(a?.time) || 0;
    const timeB = Number(b?.time) || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return timeA - timeB;
  });

  const filtered = sorted.filter((t) =>
    (t?.teamName || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];

  return (
    <AnimatePresence>
      <div className="celebration-modal-backdrop">
        <canvas ref={canvasRef} className="confetti-canvas" />

        <motion.div
          className="celebration-modal glass"
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Close button */}
          <button className="celebration-close-btn" onClick={onClose} title="Close Leaderboard">
            <FaXmark />
          </button>

          {/* Header Banner */}
          <div className="celebration-header">
            <motion.div
              className="party-popper-badge"
              animate={{ rotate: [-10, 10, -10], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              🎉
            </motion.div>

            <span className="celebration-subtitle">AI & DS SPOT THE DIFFERENCES CHALLENGE</span>
            <h1 className="celebration-title">
              🏆 Final Event Leaderboard 🏆
            </h1>
            <p className="celebration-desc">
              Congratulations to all participating teams! The official results have been revealed.
            </p>
          </div>

          {/* Top 3 Podium Winners Cards */}
          {sorted.length > 0 && (
            <div className="podium-grid">
              {/* 2nd Place */}
              {top2 ? (
                <motion.div
                  className="podium-card silver-podium glass"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="podium-rank-badge silver">
                    <FaMedal /> 2nd Place
                  </div>
                  <h3 className="podium-team-name">{top2.teamName || 'Team'}</h3>
                  <div className="podium-score">
                    Score: <strong>{top2.score || 0} / {totalQuestions}</strong>
                  </div>
                  <div className="podium-time">
                    <FaClock /> {formatTime(top2.time)}
                  </div>
                </motion.div>
              ) : <div />}

              {/* 1st Place (CENTER HIGHLIGHT) */}
              {top1 && (
                <motion.div
                  className="podium-card gold-podium glass"
                  initial={{ y: -10, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1.05 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                >
                  <div className="crown-icon">
                    <FaCrown />
                  </div>
                  <div className="podium-rank-badge gold">
                    <FaTrophy /> 🥇 CHAMPION
                  </div>
                  <h2 className="podium-team-name gold-text">{top1.teamName || 'Team'}</h2>
                  <div className="podium-score gold-score">
                    Score: <strong>{top1.score || 0} / {totalQuestions}</strong>
                  </div>
                  <div className="podium-time">
                    <FaClock /> {formatTime(top1.time)}
                  </div>
                </motion.div>
              )}

              {/* 3rd Place */}
              {top3 ? (
                <motion.div
                  className="podium-card bronze-podium glass"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="podium-rank-badge bronze">
                    <FaMedal /> 3rd Place
                  </div>
                  <h3 className="podium-team-name">{top3.teamName || 'Team'}</h3>
                  <div className="podium-score">
                    Score: <strong>{top3.score || 0} / {totalQuestions}</strong>
                  </div>
                  <div className="podium-time">
                    <FaClock /> {formatTime(top3.time)}
                  </div>
                </motion.div>
              ) : <div />}
            </div>
          )}

          {/* Full Searchable Table */}
          <div className="celebration-table-section glass">
            <div className="table-filter-bar">
              <div className="search-input-wrapper">
                <FaMagnifyingGlass className="search-icon-mini" />
                <input
                  type="text"
                  placeholder="Search your team name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-modal"
                />
              </div>
              <span className="total-teams-tag">
                {sorted.length} Teams Completed
              </span>
            </div>

            <div className="table-scroll-area">
              {filtered.length === 0 ? (
                <div className="modal-empty-state">
                  <FaTrophy className="empty-trophy" />
                  <p>No matching team results found.</p>
                </div>
              ) : (
                <table className="celebration-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Team Name</th>
                      <th>Score</th>
                      <th>Total Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t, idx) => {
                      const tName = t?.teamName || '';
                      const rankIndex = sorted.findIndex((item) => (item?.teamName || '') === tName) + 1;
                      const isMyTeam = Boolean(myTeamName && tName && tName.toLowerCase() === myTeamName.toLowerCase());

                      return (
                        <tr
                          key={t.id || tName + idx}
                          className={`${isMyTeam ? 'my-team-row' : ''} ${rankIndex <= 3 ? 'top-three-row' : ''}`}
                        >
                          <td className="rank-col">
                            {rankIndex === 1 ? <span className="rank-badge gold-bg">🥇 1st</span> :
                             rankIndex === 2 ? <span className="rank-badge silver-bg">🥈 2nd</span> :
                             rankIndex === 3 ? <span className="rank-badge bronze-bg">🥉 3rd</span> :
                             `#${rankIndex}`}
                          </td>
                          <td className="team-col">
                            <strong>{tName || 'Anonymous Team'}</strong>
                            {isMyTeam && <span className="your-team-pill">YOUR TEAM</span>}
                          </td>
                          <td className="score-col">
                            <span className="score-badge-modal">{t.score || 0} / {totalQuestions}</span>
                          </td>
                          <td className="time-col">
                            <FaClock className="clock-icon-mini" /> {formatTime(t.time)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="modal-footer-celebration">
            <button className="celebration-done-btn" onClick={onClose}>
              <FaCircleCheck /> Awesome! Close Leaderboard
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
