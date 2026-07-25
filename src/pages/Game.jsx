import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import defaultQuestions from '../data/questions.json';
import Navbar from '../components/Navbar';
import GameCard from '../components/GameCard';
import FloatingBackground from '../components/FloatingBackground';
import Button from '../components/Button';
import { FaPause, FaHouse } from 'react-icons/fa6';

export default function Game({ onHome, onComplete, teamName }) {
  // Dynamic question list state (client-safe — no answers)
  const [questionsList, setQuestionsList] = useState(() => {
    const saved = localStorage.getItem('quiz_custom_questions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Strip answers from client-side data for safety
          return parsed.map(({ answer, ...rest }) => rest);
        }
      } catch (e) { console.error('[Game] Questions parse error:', e.message); }
    }
    return defaultQuestions;
  });

  const [quizStatus, setQuizStatus] = useState(() => {
    return localStorage.getItem('quiz_status') || 'active';
  });

  const cleanupAndGoHome = useCallback(() => {
    localStorage.removeItem('quiz_game_index');
    localStorage.removeItem('quiz_game_score');
    localStorage.removeItem('quiz_game_start_time');
    sessionStorage.removeItem('quiz_current_team');
    sessionStorage.removeItem('quiz_current_view');
    onHome();
  }, [onHome]);

  // Load latest questions & status from server
  useEffect(() => {
    const fetchLatestServerData = async () => {
      // Fetch client-safe questions (no answers)
      try {
        const res = await fetch('/api/questions');
        if (res.ok) {
          const body = await res.json();
          if (Array.isArray(body.questions) && body.questions.length > 0) {
            setQuestionsList(body.questions);
          }
        }
      } catch (e) { console.error('[Game] Questions fetch error:', e.message); }

      try {
        const resStatus = await fetch('/api/status');
        if (resStatus.ok) {
          const bodyStatus = await resStatus.json();
          if (bodyStatus.status) {
            setQuizStatus(bodyStatus.status);
            localStorage.setItem('quiz_status', bodyStatus.status);
          }
        }
      } catch (e) { console.error('[Game] Status fetch error:', e.message); }

      // Check if session was kicked by admin
      if (teamName) {
        let kickedList = [];
        try {
          kickedList = JSON.parse(localStorage.getItem('quiz_kicked_teams') || '[]');
        } catch (e) {}
        if (Array.isArray(kickedList) && kickedList.includes(teamName)) {
          cleanupAndGoHome();
        }
      }
    };

    fetchLatestServerData();

    const handleStorageChange = () => {
      fetchLatestServerData();
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(fetchLatestServerData, 3000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [teamName, cleanupAndGoHome]);

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

  // Fix #17: Timer uses setInterval at 100ms instead of requestAnimationFrame
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let savedStart = Number(localStorage.getItem('quiz_game_start_time'));
    const now = Date.now();
    if (!savedStart || savedStart > now || (now - savedStart > 7200000)) {
      savedStart = now;
      localStorage.setItem('quiz_game_start_time', String(savedStart));
    }
    startTimeRef.current = savedStart;

    // Use setInterval at 100ms instead of RAF (~60fps)
    timerRef.current = setInterval(() => {
      if (startTimeRef.current > 0) {
        setElapsed(Date.now() - startTimeRef.current);
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Live active team progress sync to central server API
  useEffect(() => {
    if (!teamName) return;

    // Check if team is already marked as kicked locally
    let kickedList = [];
    try {
      kickedList = JSON.parse(localStorage.getItem('quiz_kicked_teams') || '[]');
    } catch (e) {}
    if (Array.isArray(kickedList) && kickedList.includes(teamName)) {
      cleanupAndGoHome();
      return;
    }

    fetch('/api/team/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, score, currentQuestion: index + 1 })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.kicked) {
          // Kicked by Admin on central server!
          let currentKicked = [];
          try {
            currentKicked = JSON.parse(localStorage.getItem('quiz_kicked_teams') || '[]');
          } catch (e) {}
          if (Array.isArray(currentKicked) && !currentKicked.includes(teamName)) {
            currentKicked.push(teamName);
            localStorage.setItem('quiz_kicked_teams', JSON.stringify(currentKicked));
          }
          cleanupAndGoHome();
        }
      })
      .catch((e) => { console.error('[Game] Progress sync error:', e.message); });

    try {
      const active = JSON.parse(localStorage.getItem('quiz_active_teams') || '[]');
      const exists = active.some(t => t.teamName === teamName);
      if (exists) {
        const updated = active.map(t => {
          if (t.teamName === teamName) {
            return { ...t, score, currentQuestion: index + 1, lastActive: Date.now() };
          }
          return t;
        });
        localStorage.setItem('quiz_active_teams', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) { console.error('[Game] Local active teams update error:', e.message); }
  }, [index, score, teamName, cleanupAndGoHome]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const safeIndex = Math.max(0, Math.min(index, (questionsList?.length || 1) - 1));
  const current = questionsList?.[safeIndex] || questionsList?.[0] || defaultQuestions[0];

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

  // Server-validated answer checking with instant local fallback
  const submit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !answer) return;
    setIsSubmitting(true);

    const handleAnswerResult = (isCorrect, serverScore) => {
      if (isCorrect) {
        setCorrect(true);
        setWrong(false);
        const newScore = serverScore !== undefined ? serverScore : score + 1;
        setScore(newScore);
        setTimeout(() => {
          advanceNext(newScore);
        }, 900);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setWrong(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);

        if (newAttempts >= 2) {
          setTimeout(() => {
            advanceNext(serverScore !== undefined ? serverScore : score);
          }, 1300);
        } else {
          setIsSubmitting(false);
          setTimeout(() => {
            setAnswer('');
          }, 500);
        }
      }
    };

    try {
      const res = await fetch('/api/team/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: teamName || 'Anonymous Team',
          questionId: current.id,
          answer: Number(answer)
        })
      });

      if (res.ok) {
        const data = await res.json();

        if (data.kicked) {
          cleanupAndGoHome();
          return;
        }

        if (typeof data.correct === 'boolean') {
          handleAnswerResult(data.correct, data.serverScore);
          return;
        }
      }
      
      // Fallback local validation if server endpoint did not return correct boolean
      const isLocalCorrect = Number(answer) === Number(current.answer);
      handleAnswerResult(isLocalCorrect, isLocalCorrect ? score + 1 : score);
    } catch (err) {
      console.error('[Game] Answer submit error:', err.message);
      const isLocalCorrect = Number(answer) === Number(current.answer);
      handleAnswerResult(isLocalCorrect, isLocalCorrect ? score + 1 : score);
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
