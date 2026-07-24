import { FaStar, FaClock, FaUsers } from 'react-icons/fa6';
import ProgressBar from './ProgressBar';

function formatTime(ms) {
  if (!ms || ms < 0 || isNaN(ms)) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  const millis = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${mins}:${secs}:${millis}`;
}

export default function Navbar({ question, total, score, onHome, elapsed = 0, teamName = '' }) {
  const progress = Math.round(((question - 1) / total) * 100);

  return (
    <header className="game-nav glass">

      {teamName && (
        <div className="team-pill">
          <FaUsers />
          <span className="team-pill-name">{teamName}</span>
        </div>
      )}

      <div className="nav-progress">
        <div className="question-count">
          Question <b>{question}</b> / {total}
        </div>
        <ProgressBar value={progress} />
      </div>

      <div className="timer-pill">
        <FaClock />
        <span className="timer-value">{formatTime(elapsed)}</span>
      </div>

      <div className="score-pill">
        <FaStar />
        <span>Score <b>{score}</b></span>
      </div>
    </header>
  );
}
