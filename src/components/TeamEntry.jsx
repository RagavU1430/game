import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaArrowRight, FaXmark } from 'react-icons/fa6';
import Button from './Button';

// Fix #26: Sanitize team name to prevent CSV injection
function sanitizeTeamName(name) {
  // Strip leading dangerous characters for CSV safety
  return name.replace(/^[=+\-@\t\r]+/, '').trim();
}

// Fix #20: Added onClose prop and close button
export default function TeamEntry({ open, onSubmit, onClose }) {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = sanitizeTeamName(teamName.trim());
    if (!name) {
      setError('Please enter a team name');
      return;
    }
    if (name.length < 2) {
      setError('Team name must be at least 2 characters');
      return;
    }
    if (name.length > 30) {
      setError('Team name must be 30 characters or less');
      return;
    }
    setError('');
    onSubmit(name);
    setTeamName('');
  };

  const handleClose = () => {
    setTeamName('');
    setError('');
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={handleClose}
        >
          <motion.section
            className="team-modal glass"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-title"
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            {/* Close button (fix #20) */}
            <button
              className="modal-close-btn"
              onClick={handleClose}
              type="button"
              aria-label="Close"
              title="Close"
            >
              <FaXmark />
            </button>

            <div className="modal-icon team-icon">
              <FaUsers />
            </div>

            <p className="eyebrow">Before we begin</p>
            <h2 id="team-title">Enter Your Team Name</h2>
            <p className="team-modal-desc">
              Your team name will appear on the leaderboard along with your score and time.
            </p>

            <form onSubmit={handleSubmit} className="team-form">
              <div className="team-input-wrapper">
                <input
                  type="text"
                  className={`team-input ${error ? 'team-input-error' : ''}`}
                  placeholder="e.g. The Observers"
                  value={teamName}
                  onChange={(e) => { setTeamName(e.target.value); setError(''); }}
                  autoFocus
                  maxLength={30}
                />
                {error && <span className="team-error">{error}</span>}
              </div>
              <Button type="submit">
                Let's Go <FaArrowRight />
              </Button>
            </form>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
