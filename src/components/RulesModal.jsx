import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaEye } from 'react-icons/fa6';
import Button from './Button';

// Fix #21: Formatted code and corrected rules (2 attempts, timer present)
export default function RulesModal({ open, onAccept, onClose }) {
  const rules = [
    'Carefully observe the image shown.',
    'Count the hidden differences between the two scenes.',
    'Enter only the total number of differences.',
    'You get 2 attempts per question — use them wisely!',
    'A timer tracks your speed — faster teams rank higher!'
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          onMouseDown={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="rules-modal glass"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-title"
            onMouseDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <div className="modal-icon">
              <FaEye />
            </div>
            <p className="eyebrow">A mindful little challenge</p>
            <h2 id="rules-title">How to play</h2>
            <ul>
              {rules.map((rule) => (
                <li key={rule}>
                  <FaCheck /> {rule}
                </li>
              ))}
            </ul>
            <Button onClick={onAccept}>I'm ready to explore</Button>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
