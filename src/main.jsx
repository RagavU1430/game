import React, { lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import { FaLeaf, FaTrophy } from 'react-icons/fa6';
import Home from './pages/Home';
import Game from './pages/Game';
import TeamEntry from './components/TeamEntry';
import CelebrationLeaderboardModal from './components/CelebrationLeaderboardModal';
import './styles.css';

const Result = lazy(() => import('./pages/Result'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  // Use sessionStorage so new tabs always start fresh on the Home page,
  // while reloading the same tab preserves current state unless it was on result page.
  const [view, setViewInternal] = useState(() => {
    const saved = sessionStorage.getItem('quiz_current_view');
    if (saved === 'result') {
      sessionStorage.removeItem('quiz_current_view');
      return 'home';
    }
    return saved || 'home';
  });

  const [teamName, setTeamName] = useState(() => {
    return sessionStorage.getItem('quiz_current_team') || '';
  });

  const [score, setScore] = useState(() => {
    return Number(sessionStorage.getItem('quiz_current_score')) || 0;
  });

  const [totalTime, setTotalTime] = useState(() => {
    return Number(sessionStorage.getItem('quiz_current_time')) || 0;
  });

  // Track total questions dynamically
  const [totalQuestions, setTotalQuestions] = useState(10);

  const [isCompleted, setIsCompleted] = useState(false);

  const [run, setRun] = useState(0);
  const [showTeamModalFromAdmin, setShowTeamModalFromAdmin] = useState(false);

  // Leaderboard Reveal & Celebration Modal state
  const [leaderboardRevealed, setLeaderboardRevealed] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [hasAutoOpenedCelebration, setHasAutoOpenedCelebration] = useState(false);

  const setView = (newView) => {
    setViewInternal(newView);
    sessionStorage.setItem('quiz_current_view', newView);
  };

  // Fetch question count from server for dynamic total
  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.questions)) {
          setTotalQuestions(data.questions.length);
        }
      })
      .catch((e) => { console.error('[App] Questions count fetch error:', e.message); });
  }, []);

  // Poll for Quiz Status & Leaderboard Reveal State across network
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.leaderboardRevealed === 'boolean') {
            setLeaderboardRevealed(data.leaderboardRevealed);
            
            // Auto open celebration pop-up modal ONLY at the end of the quiz
            const isAtEnd = view === 'result' || (view === 'home' && isCompleted);
            if (data.leaderboardRevealed && isAtEnd) {
              if (!hasAutoOpenedCelebration) {
                setShowCelebrationModal(true);
                setHasAutoOpenedCelebration(true);
              }
            } else if (!data.leaderboardRevealed) {
              setHasAutoOpenedCelebration(false);
            }
          }
        }
      } catch (e) {
        console.error('[App] Status check error:', e.message);
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 3000);
    const handleStorage = () => checkStatus();
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
    };
  }, [view, isCompleted, hasAutoOpenedCelebration]);

  // Auto trigger modal when player finishes game if host already revealed leaderboard
  useEffect(() => {
    const isAtEnd = view === 'result' || (view === 'home' && isCompleted);
    if (leaderboardRevealed && isAtEnd && !hasAutoOpenedCelebration) {
      setShowCelebrationModal(true);
      setHasAutoOpenedCelebration(true);
    }
  }, [view, isCompleted, leaderboardRevealed, hasAutoOpenedCelebration]);

  const begin = (name) => {
    const selectedTeam = name || teamName || 'Anonymous Team';
    setTeamName(selectedTeam);
    sessionStorage.setItem('quiz_current_team', selectedTeam);
    setScore(0);
    sessionStorage.setItem('quiz_current_score', '0');
    setTotalTime(0);
    sessionStorage.setItem('quiz_current_time', '0');
    setIsCompleted(false);
    sessionStorage.setItem('quiz_completed_device', 'false');
    
    // Fresh timer & progress initialization for new game session
    localStorage.setItem('quiz_game_start_time', String(Date.now()));
    localStorage.setItem('quiz_game_index', '0');
    localStorage.setItem('quiz_game_score', '0');
    setRun((x) => x + 1);

    // Call Central Server API to register Team Login across network
    fetch('/api/team/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName: selectedTeam })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.kicked) {
          // Team was kicked by admin — prevent login
          alert('This team has been removed by the admin. Please use a different team name.');
          setView('home');
          return;
        }
      })
      .catch((e) => { console.error('[App] Login error:', e.message); });

    // Fallback local storage update
    try {
      const activeTeams = JSON.parse(localStorage.getItem('quiz_active_teams') || '[]');
      const newActive = {
        id: 'team_' + Date.now(),
        teamName: selectedTeam,
        startedAt: Date.now(),
        lastActive: Date.now(),
        score: 0,
        currentQuestion: 1,
        status: 'Playing'
      };
      const filtered = activeTeams.filter(t => t.teamName !== selectedTeam);
      const updated = [newActive, ...filtered];
      localStorage.setItem('quiz_active_teams', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (e) { console.error('[App] Active teams update error:', e.message); }

    setView('game');
  };

  const handleGameComplete = (finalScore, finalTime) => {
    setScore(finalScore);
    sessionStorage.setItem('quiz_current_score', String(finalScore));
    setTotalTime(finalTime);
    sessionStorage.setItem('quiz_current_time', String(finalTime));

    const currentTeam = teamName || 'Anonymous Team';

    // 1. Immediately update local storage so completed team is NEVER lost locally
    try {
      const existing = JSON.parse(localStorage.getItem('quiz_leaderboard') || '[]');
      const filtered = existing.filter(t => t.teamName.toLowerCase() !== currentTeam.toLowerCase());
      filtered.push({
        id: 'lb_' + Date.now(),
        teamName: currentTeam,
        score: finalScore,
        time: finalTime,
        timestamp: Date.now(),
        status: 'Completed'
      });
      localStorage.setItem('quiz_leaderboard', JSON.stringify(filtered));

      const active = JSON.parse(localStorage.getItem('quiz_active_teams') || '[]');
      const remainingActive = active.filter(t => t.teamName.toLowerCase() !== currentTeam.toLowerCase());
      localStorage.setItem('quiz_active_teams', JSON.stringify(remainingActive));

      window.dispatchEvent(new Event('storage'));
    } catch (e) { console.error('[App] Leaderboard local update error:', e.message); }

    // 2. Call Central Server API to register completed team on cloud DB
    fetch('/api/team/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName: currentTeam, score: finalScore, time: finalTime })
    }).catch((e) => { console.error('[App] Complete error:', e.message); });

    setView('result');
  };

  const handleAutoReturnHome = () => {
    sessionStorage.removeItem('quiz_current_view');
    sessionStorage.removeItem('quiz_completed_device');
    setIsCompleted(true);
    setView('home');
  };

  // Allow admin access via keyboard shortcut (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setView('admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => { document.title = 'Spot the Differences Challenge'; }, []);

  return (
    <main className="app-shell">
      <div className="ambient-glow glow-one" />
      <div className="ambient-glow glow-two" />
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div key="home" className="page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <Home
              onStart={(name) => begin(name)}
              isCompleted={isCompleted}
              leaderboardRevealed={leaderboardRevealed}
              onOpenLeaderboard={() => setShowCelebrationModal(true)}
            />
          </motion.div>
        )}
        {view === 'game' && (
          <motion.div key={`game-${run}`} className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Game
              onHome={() => setView('home')}
              onComplete={handleGameComplete}
              teamName={teamName}
            />
          </motion.div>
        )}
        {view === 'result' && (
          <motion.div key="result" className="page" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Suspense fallback={<div className="loading"><FaLeaf /> Gathering your score…</div>}>
              <Result
                score={score}
                totalTime={totalTime}
                teamName={teamName}
                totalQuestions={totalQuestions}
                onAutoReturnHome={handleAutoReturnHome}
                leaderboardRevealed={leaderboardRevealed}
                onOpenLeaderboard={() => setShowCelebrationModal(true)}
              />
            </Suspense>
          </motion.div>
        )}
        {view === 'admin' && (
          <motion.div key="admin" className="page" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <Suspense fallback={<div className="loading"><FaLeaf /> Loading Admin Panel…</div>}>
              <Admin
                onHome={() => setView('home')}
                onStartGame={() => setShowTeamModalFromAdmin(true)}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Leaderboard Button — ONLY at the end when host has revealed */}
      {leaderboardRevealed && (view === 'result' || (view === 'home' && isCompleted)) && (
        <motion.button
          className="floating-leaderboard-trigger glass"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCelebrationModal(true)}
          title="View Final Event Leaderboard"
        >
          <FaTrophy className="trophy-pulse-icon" />
          <span>🎉 View Final Leaderboard</span>
        </motion.button>
      )}

      {/* Global Party Celebration Modal */}
      <CelebrationLeaderboardModal
        open={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        myTeamName={teamName}
        totalQuestions={totalQuestions}
      />

      <TeamEntry
        open={showTeamModalFromAdmin}
        onSubmit={(name) => {
          setShowTeamModalFromAdmin(false);
          begin(name);
        }}
        onClose={() => setShowTeamModalFromAdmin(false)}
      />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
