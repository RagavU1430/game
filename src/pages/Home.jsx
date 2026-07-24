import { motion } from 'framer-motion';
import { FaLeaf, FaHeart, FaTrophy } from 'react-icons/fa6';
import { useState } from 'react';
import Button from '../components/Button';
import FloatingBackground from '../components/FloatingBackground';
import RulesModal from '../components/RulesModal';
import TeamEntry from '../components/TeamEntry';
import InteractiveLogo from '../components/InteractiveLogo';

export default function Home({ onStart, isCompleted = false, leaderboardRevealed = false, onOpenLeaderboard }) {
  const [rules, setRules] = useState(false);
  const [teamModal, setTeamModal] = useState(false);

  const handleRulesAccept = () => {
    setRules(false);
    setTeamModal(true);
  };

  const handleTeamSubmit = (teamName) => {
    setTeamModal(false);
    onStart(teamName);
  };

  return (
    <>
      <FloatingBackground />
      <section className="hero">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, x: -22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="eyebrow"><FaLeaf /> Department of AI & DS</p>

          {isCompleted ? (
            <motion.div
              className="completed-thankyou-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="thankyou-heart">
                <FaHeart />
              </div>
              <h1>Thank you for coming to our club nanba & nanbi!</h1>
              <p className="hero-subtitle">
                Your team response has been submitted to the live event leaderboard. We hope you enjoyed the Spot the Differences Challenge!
              </p>
              
              {leaderboardRevealed ? (
                <div style={{ marginTop: '1.2rem' }}>
                  <Button onClick={onOpenLeaderboard} className="reveal-banner-btn">
                    <FaTrophy /> 🎉 View Final Leaderboard
                  </Button>
                </div>
              ) : (
                <div className="waiting-host-reveal-banner glass" style={{ marginTop: '1.2rem', padding: '0.9rem 1.2rem', borderRadius: '16px', background: 'rgba(254, 243, 199, 0.4)', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                    ⏳ Waiting for Host to Reveal Final Leaderboard…
                  </p>
                  <small style={{ fontSize: '0.8rem', color: '#78350f', display: 'block', marginTop: '0.2rem' }}>
                    The event host will reveal the winner podium shortly! Keep this page open.
                  </small>
                </div>
              )}

              <div className="thankyou-badge-row" style={{ marginTop: '1.2rem' }}>
                <span className="club-tag">AI Frontier Club</span>
                <span className="dept-tag">Department of AI & DS</span>
              </div>
            </motion.div>
          ) : (
            <>
              <h1>Spot the <em>Differences</em> Challenge</h1>
              <p className="hero-subtitle">
                Observe carefully, count the hidden differences, and test your team's observation skills.
              </p>
              <div className="hero-actions">
                <Button onClick={() => setRules(true)}>
                  Start the game
                </Button>
              </div>
              <span className="gentle-note" style={{ marginTop: '0.8rem', display: 'block' }}>
                🏆 Track your team's score & time on the leaderboard!
              </span>
            </>
          )}
        </motion.div>

        <motion.div
          className="hero-art-wrapper"
          initial={{ opacity: 0, scale: 0.88, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <InteractiveLogo />
        </motion.div>
      </section>

      <RulesModal
        open={rules}
        onClose={() => setRules(false)}
        onAccept={handleRulesAccept}
      />

      <TeamEntry
        open={teamModal}
        onSubmit={handleTeamSubmit}
      />
    </>
  );
}
