import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaLightbulb, FaXmark } from 'react-icons/fa6';
import Button from './Button';
import Input from './Input';

export default function GameCard({
  question,
  value,
  onChange,
  onSubmit,
  correct,
  wrong,
  shake,
  attempts = 0,
  isSubmitting,
  showHint,
  onHint
}) {
  const chancesLeft = 2 - attempts;

  return (
    <motion.section
      className="game-card glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="card-top">
        <div>
          <p className="eyebrow">Scene {String(question.id).padStart(2, '0')}</p>
          <h2>{question.title || 'Find the quiet changes'}</h2>
        </div>
        <div className="chances-badge">
          Chances: <strong>{chancesLeft} / 2</strong>
        </div>
      </div>

      <div className="image-single">
        <motion.div whileHover={{ y: -4 }}>
          <div className="scene-frame">
            <img
              src={question.image}
              alt={`Spot the difference scene for question ${question.id}`}
              loading="lazy"
            />
          </div>
        </motion.div>
      </div>

      <form className="answer-row" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="difference-answer">Number of differences</label>
        <Input
          id="difference-answer"
          placeholder="Enter number of differences"
          aria-describedby="answer-feedback"
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
          shake={shake}
          disabled={correct || isSubmitting || chancesLeft <= 0}
        />
        <Button type="submit" disabled={correct || !value || isSubmitting || chancesLeft <= 0} className="submit-button">
          Check answer <FaCheck />
        </Button>
        {!correct && !showHint && (
          <Button type="button" className="hint-button" onClick={onHint} disabled={isSubmitting}>
            <FaLightbulb /> Hint
          </Button>
        )}
      </form>

      {showHint && !correct && question.hint && (
        <motion.p
          className="hint-text"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          💡 {question.hint}
        </motion.p>
      )}

      <AnimatePresence mode="wait">
        <motion.p
          id="answer-feedback"
          className={`feedback ${correct ? 'correct' : wrong ? 'wrong' : ''}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {correct ? (
            <><FaCheck /> Correct! Moving to next scene...</>
          ) : wrong ? (
            chancesLeft > 0 ? (
              <><FaXmark /> Incorrect! {chancesLeft} chance left. Try again.</>
            ) : (
              <><FaXmark /> Out of chances! Moving to next scene...</>
            )
          ) : (
            `Count the differences and enter your answer.`
          )}
        </motion.p>
      </AnimatePresence>
    </motion.section>
  );
}
