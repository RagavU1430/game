import { motion } from 'framer-motion';
import { FaArrowRight, FaLeaf, FaUserShield } from 'react-icons/fa6';
import { useState } from 'react';
import Button from '../components/Button';
import FloatingBackground from '../components/FloatingBackground';
import RulesModal from '../components/RulesModal';
import TeamEntry from '../components/TeamEntry';
import InteractiveLogo from '../components/InteractiveLogo';

export default function Home({ onStart, onOpenAdmin }) {
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
          <h1>Spot the <em>Differences</em> Challenge</h1>
          <p className="hero-subtitle">
            Observe carefully, count the hidden differences, and test your team's observation skills.
          </p>
          <div className="hero-actions">
            <Button onClick={() => setRules(true)}>
              Start the game <FaArrowRight />
            </Button>
            <Button className="secondary admin-nav-btn" onClick={onOpenAdmin}>
              <FaUserShield /> Admin Panel
            </Button>
          </div>
          <span className="gentle-note" style={{ marginTop: '0.8rem', display: 'block' }}>
            🏆 Track your team's score & time on the leaderboard!
          </span>
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
