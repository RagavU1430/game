import React, { lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import { FaLeaf } from 'react-icons/fa6';
import Home from './pages/Home';
import Game from './pages/Game';
import TeamEntry from './components/TeamEntry';
import './styles.css';

const Result = lazy(() => import('./pages/Result'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  // Persist current view across page reloads
  const [view, setViewInternal] = useState(() => {
    return localStorage.getItem('quiz_current_view') || 'home';
  });

  const [teamName, setTeamName] = useState(() => {
    return localStorage.getItem('quiz_current_team') || '';
  });

  const [score, setScore] = useState(() => {
    return Number(localStorage.getItem('quiz_current_score')) || 0;
  });

  const [totalTime, setTotalTime] = useState(() => {
    return Number(localStorage.getItem('quiz_current_time')) || 0;
  });

  const [isCompleted, setIsCompleted] = useState(() => {
    return localStorage.getItem('quiz_completed_device') === 'true';
  });

  const [run, setRun] = useState(0);
  const [showTeamModalFromAdmin, setShowTeamModalFromAdmin] = useState(false);

  const setView = (newView) => {
    setViewInternal(newView);
    localStorage.setItem('quiz_current_view', newView);
  };

  const begin = (name) => {
    const selectedTeam = name || teamName || 'Anonymous Team';
    setTeamName(selectedTeam);
    localStorage.setItem('quiz_current_team', selectedTeam);
    setScore(0);
    localStorage.setItem('quiz_current_score', '0');
    setTotalTime(0);
    localStorage.setItem('quiz_current_time', '0');
    setIsCompleted(false);
    localStorage.setItem('quiz_completed_device', 'false');
    setRun((x) => x + 1);

    // Call Central Server API to register Team Login across network
    fetch('/api/team/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName: selectedTeam })
    }).catch(() => {});

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
    } catch (e) {}

    setView('game');
  };

  const handleGameComplete = (finalScore, finalTime) => {
    setScore(finalScore);
    localStorage.setItem('quiz_current_score', String(finalScore));
    setTotalTime(finalTime);
    localStorage.setItem('quiz_current_time', String(finalTime));

    const currentTeam = teamName || 'Anonymous Team';

    // Call Central Server API to mark quiz complete across network
    fetch('/api/team/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName: currentTeam, score: finalScore, time: finalTime })
    }).catch(() => {});

    // Fallback local storage update
    try {
      const existing = JSON.parse(localStorage.getItem('quiz_leaderboard') || '[]');
      existing.push({
        teamName: currentTeam,
        score: finalScore,
        time: finalTime,
        timestamp: Date.now(),
        status: 'Completed'
      });
      localStorage.setItem('quiz_leaderboard', JSON.stringify(existing));

      const active = JSON.parse(localStorage.getItem('quiz_active_teams') || '[]');
      const remainingActive = active.filter(t => t.teamName !== currentTeam);
      localStorage.setItem('quiz_active_teams', JSON.stringify(remainingActive));

      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    setView('result');
  };

  const handleAutoReturnHome = () => {
    setIsCompleted(true);
    localStorage.setItem('quiz_completed_device', 'true');
    setView('home');
  };

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
              onOpenAdmin={() => setView('admin')}
              isCompleted={isCompleted}
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
                onAutoReturnHome={handleAutoReturnHome}
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

      <TeamEntry
        open={showTeamModalFromAdmin}
        onSubmit={(name) => {
          setShowTeamModalFromAdmin(false);
          begin(name);
        }}
      />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
