import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import questions from '../data/questions.json';
import Navbar from '../components/Navbar';
import GameCard from '../components/GameCard';
import FloatingBackground from '../components/FloatingBackground';

export default function Game({ onHome, onComplete, teamName }) {
  // Restore current question index on refresh
  const [index, setIndexInternal] = useState(() => {
    return Number(localStorage.getItem('quiz_game_index')) || 0;
  });

  const setIndex = (valOrFn) => {
    setIndexInternal((prev) => {
      const nextVal = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      localStorage.setItem('quiz_game_index', String(nextVal));
      return nextVal;
    });
  };

  const [answer, setAnswer] = useState('');
  const [correct, setCorrect] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0); // Max 2 attempts per question
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore current score on refresh
  const [score, setScoreInternal] = useState(() => {
    return Number(localStorage.getItem('quiz_game_score')) || 0;
  });

  const setScore = (valOrFn) => {
    setScoreInternal((prev) => {
      const nextVal = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      localStorage.setItem('quiz_game_score', String(nextVal));
      return nextVal;
    });
  };

  const [showHint, setShowHint] = useState(false);

  // Timer state — restore startTime so refresh doesn't reset clock
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    let savedStart = Number(localStorage.getItem('quiz_game_start_time'));
    if (!savedStart) {
      savedStart = Date.now();
      localStorage.setItem('quiz_game_start_time', String(savedStart));
    }
    startTimeRef.current = savedStart;
  }, []);

  const tick = useCallback(() => {
    if (startTimeRef.current > 0) {
      setElapsed(Date.now() - startTimeRef.current);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  // Live active team progress sync to central server API across network
  useEffect(() => {
    if (!teamName) return;
    fetch('/api/team/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, score, currentQuestion: index + 1 })
    }).catch(() => {});

    try {
      const active = JSON.parse(localStorage.getItem('quiz_active_teams') || '[]');
      const exists = active.some(t => t.teamName === teamName);
      let updated;
      if (exists) {
        updated = active.map(t => {
          if (t.teamName === teamName) {
            return { ...t, score, currentQuestion: index + 1, lastActive: Date.now() };
          }
          return t;
        });
      } else {
        updated = [
          {
            id: 'team_' + Date.now(),
            teamName,
            startedAt: Date.now(),
            lastActive: Date.now(),
            score,
            currentQuestion: index + 1,
            status: 'Playing'
          },
          ...active
        ];
      }
      localStorage.setItem('quiz_active_teams', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  }, [index, score, teamName]);

  const stopTimer = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const current = questions[index] || questions[0];

  const advanceNext = (currentScore = score) => {
    if (index >= questions.length - 1) {
      stopTimer();
      // Clean up game progress state upon completion
      localStorage.removeItem('quiz_game_index');
      localStorage.removeItem('quiz_game_score');
      localStorage.removeItem('quiz_game_start_time');
      onComplete(currentScore, elapsed);
    } else {
      setIndex((i) => i + 1);
      setAnswer('');
      setCorrect(false);
      setWrong(false);
      setAttempts(0);
      setShowHint(false);
      setIsSubmitting(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (isSubmitting || !answer) return;

    if (Number(answer) === current.answer) {
      // Correct answer! Add score and auto advance directly
      setCorrect(true);
      setWrong(false);
      setIsSubmitting(true);
      const newScore = score + 1;
      setScore(newScore);

      setTimeout(() => {
        advanceNext(newScore);
      }, 900);
    } else {
      // Wrong answer -> 2 chances max
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setWrong(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);

      if (newAttempts >= 2) {
        // Out of chances! Auto advance to next question
        setIsSubmitting(true);
        setTimeout(() => {
          advanceNext(score);
        }, 1300);
      } else {
        // 1 attempt left, clear answer so user can retry
        setTimeout(() => {
          setAnswer('');
        }, 500);
      }
    }
  };

  const handleHomeClick = () => {
    localStorage.removeItem('quiz_game_index');
    localStorage.removeItem('quiz_game_score');
    localStorage.removeItem('quiz_game_start_time');
    onHome();
  };

  return (
    <>
      <FloatingBackground />
      <div className="game-layout">
        <Navbar
          question={index + 1}
          total={questions.length}
          score={score}
          onHome={handleHomeClick}
          elapsed={elapsed}
          teamName={teamName}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -22 }}
          >
            <GameCard
              question={current}
              value={answer}
              onChange={setAnswer}
              onSubmit={submit}
              correct={correct}
              wrong={wrong}
              shake={shake}
              attempts={attempts}
              isSubmitting={isSubmitting}
              onNext={() => advanceNext()}
              isLast={index === questions.length - 1}
              showHint={showHint}
              onHint={() => setShowHint(true)}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
