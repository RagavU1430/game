import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import defaultQuestions from '../data/questions.json';
import Navbar from '../components/Navbar';
import GameCard from '../components/GameCard';
import FloatingBackground from '../components/FloatingBackground';
import Button from '../components/Button';
import { FaPause, FaHouse } from 'react-icons/fa6';

export default function Game({ onHome, onComplete, teamName }) {
  // Dynamic question list state
  const [questionsList, setQuestionsList] = useState(() => {
    const saved = localStorage.getItem('quiz_custom_questions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return defaultQuestions;
  });

  const [quizStatus, setQuizStatus] = useState(() => {
    return localStorage.getItem('quiz_status') || 'active';
  });

  // Load latest questions & status from server or localStorage
  useEffect(() => {
    const fetchLatestServerData = async () => {
      try {
        const res = await fetch('/api/admin/questions');
        if (res.ok) {
          const body = await res.json();
          if (Array.isArray(body.questions) && body.questions.length > 0) {
            setQuestionsList(body.questions);
            localStorage.setItem('quiz_custom_questions', JSON.stringify(body.questions));
          }
        }
      } catch (e) {}

      try {
        const resStatus = await fetch('/api/admin/status');
        if (resStatus.ok) {
          const bodyStatus = await resStatus.json();
          if (bodyStatus.status) {
            setQuizStatus(bodyStatus.status);
            localStorage.setItem('quiz_status', bodyStatus.status);
          }
        }
      } catch (e) {}
    };

    fetchLatestServerData();

    const handleStorageChange = () => {
      const savedQ = localStorage.getItem('quiz_custom_questions');
      if (savedQ) {
        try {
          const parsed = JSON.parse(savedQ);
          if (Array.isArray(parsed) && parsed.length > 0) setQuestionsList(parsed);
        } catch (e) {}
      }
      const savedStatus = localStorage.getItem('quiz_status');
      if (savedStatus) setQuizStatus(savedStatus);

      // Check if session was kicked by admin
      if (teamName) {
        const active = JSON.parse(localStorage.getItem('quiz_active_teams') || '[]');
        const isStillActive = active.some(t => t.teamName === teamName);
        if (!isStillActive) {
          // Team session was cleared/kicked by admin!
          localStorage.removeItem('quiz_game_index');
          localStorage.removeItem('quiz_game_score');
          localStorage.removeItem('quiz_game_start_time');
          onHome();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [teamName, onHome]);

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
  const [attempts, setAttempts] = useState(0);
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

  const safeIndex = Math.min(index, questionsList.length - 1);
  const current = questionsList[safeIndex] || questionsList[0] || defaultQuestions[0];

  const advanceNext = (currentScore = score) => {
    if (safeIndex >= questionsList.length - 1) {
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

  // If Quiz is set to Paused by Admin, show pause screen
  if (quizStatus === 'paused') {
    return (
      <>
        <FloatingBackground />
        <div className="paused-screen-container">
          <motion.div
            className="paused-card glass"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="paused-icon-badge">
              <FaPause />
            </div>
            <h1>Quiz Paused by Admin</h1>
            <p>
              The competition round is currently on pause for maintenance or instructions. Please wait while the event moderator resumes the quiz!
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <Button onClick={handleHomeClick} className="secondary">
                <FaHouse /> Return Home
              </Button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <FloatingBackground />
      <div className="game-layout">
        <Navbar
          question={safeIndex + 1}
          total={questionsList.length}
          score={score}
          onHome={handleHomeClick}
          elapsed={elapsed}
          teamName={teamName}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id || safeIndex}
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
              isLast={safeIndex === questionsList.length - 1}
              showHint={showHint}
              onHint={() => setShowHint(true)}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
