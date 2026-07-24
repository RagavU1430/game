import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTrophy, FaTrash, FaDownload, FaHouse, FaClock, FaMedal, FaLock, FaKey,
  FaMagnifyingGlass, FaPlay, FaGamepad, FaTowerBroadcast, FaPenToSquare,
  FaPlus, FaRotateLeft, FaPause, FaCircleCheck, FaSliders, FaListCheck
} from 'react-icons/fa6';
import Button from '../components/Button';
import FloatingBackground from '../components/FloatingBackground';

function formatTime(ms) {
  if (!ms && ms !== 0) return 'N/A';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  const millis = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${mins}:${secs}:${millis}`;
}

const DEFAULT_QUESTIONS_LIST = [
  {"id": 1, "image": "/images/q1.jpeg", "answer": 6, "title": "Beach Day", "hint": "Look at the sand castle, beach ball, and umbrella"},
  {"id": 2, "image": "/images/q2.jpeg", "answer": 3, "title": "Horse Racing", "hint": "Check the jockey's gear and the horse's features"},
  {"id": 3, "image": "/images/q3.jpeg", "answer": 3, "title": "Vegetables", "hint": "Compare the mushrooms, potatoes, and carrots"},
  {"id": 4, "image": "/images/q4.jpeg", "answer": 5, "title": "Art Class", "hint": "Look at the crayons, paint palette, and shapes"},
  {"id": 5, "image": "/images/q5.jpeg", "answer": 5, "title": "Zoo Visit", "hint": "Check the animals, children, and fence area"},
  {"id": 6, "image": "/images/q6.jpeg", "answer": 6, "title": "Construction", "hint": "Look at the workers, tools, and steel beams"},
  {"id": 7, "image": "/images/q7.jpeg", "answer": 5, "title": "Carnival Fun", "hint": "Check the ferris wheel, tent, and ticket booth"},
  {"id": 8, "image": "/images/q8.jpeg", "answer": 5, "title": "School Bus", "hint": "Look at the birds, bus number, and children"},
  {"id": 9, "image": "/images/q9.jpeg", "answer": 5, "title": "Baseball", "hint": "Check the trees, ball, and boy's clothes"},
  {"id": 10, "image": "/images/q10.jpeg", "answer": 3, "title": "Forest Picnic", "hint": "Look at the fruit, cup, and sky"}
];

export default function Admin({ onHome, onStartGame }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('quiz_admin_auth') === 'true';
  });

  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState('');
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor', 'questions', 'controls'

  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTeams, setActiveTeams] = useState([]);
  const [questionsBank, setQuestionsBank] = useState(() => {
    const saved = localStorage.getItem('quiz_custom_questions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_QUESTIONS_LIST;
  });
  const [quizStatus, setQuizStatus] = useState(() => {
    return localStorage.getItem('quiz_status') || 'active';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rank');

  // Question editing modal state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formHint, setFormHint] = useState('');

  const ADMIN_PIN = 'admin123';

  // Live polling and synchronization
  const syncData = useCallback(async () => {
    let serverLeaderboard = [];
    let serverActive = [];
    let serverQuestions = null;
    let serverStatus = null;

    try {
      const res = await fetch('/api/admin/live');
      if (res.ok) {
        const data = await res.json();
        serverLeaderboard = Array.isArray(data.leaderboard) ? data.leaderboard : [];
        serverActive = Array.isArray(data.activeTeams) ? data.activeTeams : [];
        if (Array.isArray(data.questions) && data.questions.length > 0) serverQuestions = data.questions;
        if (data.quizStatus) serverStatus = data.quizStatus;
      }
    } catch (e) {}

    try {
      const localLeaderboard = JSON.parse(localStorage.getItem('quiz_leaderboard') || '[]');
      const localActive = JSON.parse(localStorage.getItem('quiz_active_teams') || '[]');

      // Merge leaderboards
      const combinedLeaderboard = [...serverLeaderboard];
      localLeaderboard.forEach(item => {
        if (!combinedLeaderboard.some(s => s.teamName === item.teamName && s.timestamp === item.timestamp)) {
          combinedLeaderboard.push(item);
        }
      });

      // Merge active teams by teamName
      const activeMap = new Map();
      localActive.forEach(t => {
        if (t && t.teamName) activeMap.set(t.teamName, t);
      });
      serverActive.forEach(t => {
        if (t && t.teamName) {
          const existing = activeMap.get(t.teamName);
          if (!existing || (t.lastActive || 0) >= (existing.lastActive || 0)) {
            activeMap.set(t.teamName, t);
          }
        }
      });

      const now = Date.now();
      const completedNames = new Set(combinedLeaderboard.map(l => l.teamName));
      const finalActive = Array.from(activeMap.values()).filter(t => {
        if (completedNames.has(t.teamName)) return false;
        if (t.lastActive && (now - t.lastActive > 1800000)) return false;
        return true;
      });

      setLeaderboard(combinedLeaderboard);
      setActiveTeams(finalActive);

      if (serverQuestions) {
        setQuestionsBank(serverQuestions);
        localStorage.setItem('quiz_custom_questions', JSON.stringify(serverQuestions));
      }
      if (serverStatus) {
        setQuizStatus(serverStatus);
        localStorage.setItem('quiz_status', serverStatus);
      }

      localStorage.setItem('quiz_leaderboard', JSON.stringify(combinedLeaderboard));
      localStorage.setItem('quiz_active_teams', JSON.stringify(finalActive));
    } catch (err) {}
  }, []);

  useEffect(() => {
    syncData();
    const handleStorageChange = () => syncData();
    window.addEventListener('storage', handleStorageChange);
    const intervalId = setInterval(syncData, 1000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [syncData]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PIN || passcode === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('quiz_admin_auth', 'true');
      setPassError('');
    } else {
      setPassError('Incorrect passcode! (Default: admin123)');
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all team results and live sessions? This action cannot be undone.')) {
      try {
        await fetch('/api/admin/clear', { method: 'POST' });
      } catch (e) {}
      localStorage.removeItem('quiz_leaderboard');
      localStorage.removeItem('quiz_active_teams');
      setLeaderboard([]);
      setActiveTeams([]);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleDeleteEntry = async (itemToDelete, indexToDelete) => {
    try {
      await fetch('/api/admin/delete-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemToDelete.id })
      });
    } catch (e) {}

    const updated = leaderboard.filter((_, idx) => idx !== indexToDelete);
    setLeaderboard(updated);
    localStorage.setItem('quiz_leaderboard', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteActiveTeam = async (teamNameToDelete) => {
    if (!window.confirm(`Are you sure you want to kick team "${teamNameToDelete}" out of the live game?`)) {
      return;
    }

    try {
      await fetch('/api/admin/delete-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: teamNameToDelete })
      });
    } catch (e) {}

    const currentKicked = JSON.parse(localStorage.getItem('quiz_kicked_teams') || '[]');
    if (!currentKicked.includes(teamNameToDelete)) {
      currentKicked.push(teamNameToDelete);
      localStorage.setItem('quiz_kicked_teams', JSON.stringify(currentKicked));
    }

    const updated = activeTeams.filter(t => t.teamName !== teamNameToDelete);
    setActiveTeams(updated);
    localStorage.setItem('quiz_active_teams', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleExportCSV = () => {
    if (leaderboard.length === 0) return;
    let csvContent = 'data:text/csv;charset=utf-8,Rank,Team Name,Score,Total Time (ms),Time Formatted,Date\n';
    
    const sorted = [...leaderboard].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.time - b.time;
    });

    sorted.forEach((item, index) => {
      const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A';
      csvContent += `${index + 1},"${item.teamName.replace(/"/g, '""')}",${item.score},${item.time},${formatTime(item.time)},"${dateStr}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spot_difference_leaderboard_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Question Bank Actions ---
  const saveQuestionsToServer = async (action, data) => {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });
      if (res.ok) {
        const body = await res.json();
        if (body.questions) {
          setQuestionsBank(body.questions);
          localStorage.setItem('quiz_custom_questions', JSON.stringify(body.questions));
          window.dispatchEvent(new Event('storage'));
          return body.questions;
        }
      }
    } catch (e) {}

    // Fallback to local updating
    let updated = [...questionsBank];
    if (action === 'reset') {
      updated = [...DEFAULT_QUESTIONS_LIST];
    } else if (action === 'add' && data.question) {
      const nextId = updated.length > 0 ? Math.max(...updated.map(q => q.id)) + 1 : 1;
      updated.push({ ...data.question, id: nextId });
    } else if (action === 'update' && data.question) {
      updated = updated.map(q => q.id === data.question.id ? { ...q, ...data.question } : q);
    } else if (action === 'delete' && data.id) {
      updated = updated.filter(q => q.id !== data.id);
    }

    setQuestionsBank(updated);
    localStorage.setItem('quiz_custom_questions', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    return updated;
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setFormTitle(q.title || '');
    setFormImage(q.image || '');
    setFormAnswer(String(q.answer || ''));
    setFormHint(q.hint || '');
  };

  const handleOpenAdd = () => {
    setShowAddModal(true);
    setFormTitle('');
    setFormImage('/images/q1.jpeg');
    setFormAnswer('5');
    setFormHint('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingQuestion) return;
    const updatedObj = {
      ...editingQuestion,
      title: formTitle.trim(),
      image: formImage.trim(),
      answer: Number(formAnswer) || 0,
      hint: formHint.trim()
    };
    await saveQuestionsToServer('update', { question: updatedObj });
    setEditingQuestion(null);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    const newObj = {
      title: formTitle.trim() || 'New Question',
      image: formImage.trim() || '/images/q1.jpeg',
      answer: Number(formAnswer) || 5,
      hint: formHint.trim() || 'Look carefully at all the details'
    };
    await saveQuestionsToServer('add', { question: newObj });
    setShowAddModal(false);
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm('Delete this question from the active Quiz bank?')) {
      await saveQuestionsToServer('delete', { id });
    }
  };

  const handleResetDefaultQuestions = async () => {
    if (window.confirm('Reset question bank to the 10 original default questions?')) {
      await saveQuestionsToServer('reset', {});
    }
  };

  // --- Quiz Status Actions ---
  const handleToggleQuizStatus = async (newStatus) => {
    setQuizStatus(newStatus);
    localStorage.setItem('quiz_status', newStatus);
    window.dispatchEvent(new Event('storage'));
    try {
      await fetch('/api/admin/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {}
  };

  // Sort and filter leaderboard
  const processedLeaderboard = [...leaderboard]
    .filter(item => item.teamName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.teamName.localeCompare(b.teamName);
      if (sortBy === 'time') return a.time - b.time;
      if (b.score !== a.score) return b.score - a.score;
      return a.time - b.time;
    });

  const totalTeams = leaderboard.length;
  const bestScore = leaderboard.length > 0 ? Math.max(...leaderboard.map(l => l.score)) : 0;
  const fastestTime = leaderboard.length > 0 ? Math.min(...leaderboard.map(l => l.time)) : 0;

  if (!isAuthenticated) {
    return (
      <>
        <FloatingBackground />
        <section className="admin-login-page">
          <motion.div
            className="admin-card glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="admin-lock-icon">
              <FaLock />
            </div>
            <p className="eyebrow">Restricted Access</p>
            <h1>Admin Dashboard</h1>
            <p className="admin-subtext">Enter the admin passcode to view team results and manage quiz questions.</p>

            <form onSubmit={handleLogin} className="admin-form">
              <div className="input-group-admin">
                <FaKey className="key-icon" />
                <input
                  type="password"
                  placeholder="Enter passcode (admin123)"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="admin-input"
                  autoFocus
                />
              </div>
              {passError && <p className="admin-error">{passError}</p>}
              <div className="admin-login-actions">
                <Button type="submit">Unlock Dashboard</Button>
                <Button type="button" className="secondary" onClick={onHome}>
                  <FaHouse /> Back Home
                </Button>
              </div>
            </form>
          </motion.div>
        </section>
      </>
    );
  }

  return (
    <>
      <FloatingBackground />
      <div className="admin-dashboard">
        <header className="admin-header glass">
          <div>
            <div className="live-badge-wrapper">
              <span className={quizStatus === 'active' ? "live-dot-pulse" : "paused-dot-pulse"}></span>
              <span className="live-text">
                <FaTowerBroadcast /> LIVE EVENT CONTROL • {quizStatus === 'active' ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <h1>Admin Dashboard & Control Center</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Button onClick={onStartGame}>
              <FaPlay /> Launch Quiz Round
            </Button>
            <Button className="secondary" onClick={onHome}>
              <FaHouse /> Home Page
            </Button>
          </div>
        </header>

        {/* Tab Selector */}
        <div className="admin-tabs glass" style={{ display: 'flex', gap: '0.8rem', padding: '0.8rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
          <button
            className={`admin-tab-btn ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            <FaTrophy /> Live Leaderboard & Monitor ({activeTeams.length} Active)
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <FaListCheck /> Question Bank Manager ({questionsBank.length} Questions)
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
            onClick={() => setActiveTab('controls')}
          >
            <FaSliders /> Quiz Settings & Status
          </button>
        </div>

        {/* TAB 1: MONITOR & LEADERBOARD */}
        {activeTab === 'monitor' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Stats Summary Cards */}
            <div className="admin-stats-grid">
              <div className="stat-card glass">
                <span className="stat-label">Currently Playing</span>
                <strong className="stat-value highlight-live">{activeTeams.length} <small>Teams</small></strong>
              </div>
              <div className="stat-card glass">
                <span className="stat-label">Completed Teams</span>
                <strong className="stat-value">{totalTeams}</strong>
              </div>
              <div className="stat-card glass">
                <span className="stat-label">Highest Score</span>
                <strong className="stat-value">{bestScore} <small>/ {questionsBank.length}</small></strong>
              </div>
              <div className="stat-card glass">
                <span className="stat-label">Fastest Time</span>
                <strong className="stat-value">{fastestTime ? formatTime(fastestTime) : 'N/A'}</strong>
              </div>
            </div>

            {/* Live Active Teams Section */}
            {activeTeams.length > 0 && (
              <div className="live-teams-container glass">
                <div className="live-teams-header">
                  <h2><span className="live-dot-pulse"></span> Active Teams Playing Right Now</h2>
                  <span className="live-count">{activeTeams.length} Live</span>
                </div>
                <div className="live-teams-grid">
                  {activeTeams.map((activeTeam) => (
                    <div key={activeTeam.id || activeTeam.teamName} className="live-team-card">
                      <div className="live-team-info">
                        <FaGamepad className="gamepad-icon" />
                        <div>
                          <strong>{activeTeam.teamName}</strong>
                          <div className="live-team-meta">
                            Question {activeTeam.currentQuestion || 1} / {questionsBank.length} • Score: {activeTeam.score || 0}
                          </div>
                        </div>
                      </div>
                      <div className="live-status-tag">
                        <span className="status-dot"></span> Playing
                      </div>
                      <button
                        className="delete-icon-btn"
                        onClick={() => handleDeleteActiveTeam(activeTeam.teamName)}
                        title="Reset & kick team session"
                        style={{ marginLeft: 'auto' }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Control Bar */}
            <div className="admin-controls glass">
              <div className="search-box">
                <FaMagnifyingGlass className="search-icon" />
                <input
                  type="text"
                  placeholder="Search team name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="sort-box">
                <label>Sort By:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                  <option value="rank">Rank (Highest Score)</option>
                  <option value="time">Speed (Fastest Time)</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>

              <div className="action-buttons">
                <Button onClick={handleExportCSV} disabled={leaderboard.length === 0} className="export-btn">
                  <FaDownload /> Export CSV
                </Button>
                <Button onClick={handleClearAll} disabled={leaderboard.length === 0 && activeTeams.length === 0} className="clear-btn">
                  <FaTrash /> Clear All
                </Button>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="table-container glass">
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ color: '#23463e', margin: 0 }}>🏆 Final Leaderboard</h3>
                <span style={{ fontSize: '0.85rem', color: '#568667' }}>Auto-updates live</span>
              </div>

              {processedLeaderboard.length === 0 ? (
                <div className="empty-state">
                  <FaTrophy className="empty-icon" />
                  <p>No completed team results recorded yet.</p>
                  <small>Teams playing the quiz will automatically show up here live when they complete!</small>
                </div>
              ) : (
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Team Name</th>
                      <th>Score</th>
                      <th>Time (MM:SS:MS)</th>
                      <th>Completed At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedLeaderboard.map((team, idx) => (
                      <tr key={idx} className={idx === 0 ? 'top-team' : ''}>
                        <td className="rank-cell">
                          {idx === 0 ? <span className="medal gold"><FaMedal /> 1st</span> :
                           idx === 1 ? <span className="medal silver"><FaMedal /> 2nd</span> :
                           idx === 2 ? <span className="medal bronze"><FaMedal /> 3rd</span> :
                           `#${idx + 1}`}
                        </td>
                        <td className="team-name-cell">
                          <strong>{team.teamName}</strong>
                        </td>
                        <td className="score-cell">
                          <span className="score-badge">{team.score} / {questionsBank.length}</span>
                        </td>
                        <td className="time-cell">
                          <FaClock className="clock-mini" /> {formatTime(team.time)}
                        </td>
                        <td className="date-cell">
                          {team.timestamp ? new Date(team.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </td>
                        <td className="action-cell">
                          <button
                            className="delete-icon-btn"
                            onClick={() => handleDeleteEntry(team, idx)}
                            title="Delete entry"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: QUESTION BANK MANAGER */}
        {activeTab === 'questions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="questions-header glass" style={{ padding: '1.2rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, color: '#1b3831', fontSize: '1.3rem' }}>Question Bank Manager</h2>
                <p style={{ margin: '0.3rem 0 0 0', color: '#4d755c', fontSize: '0.9rem' }}>
                  Manage, add, edit, or customize answers and hints for all questions shown in the Game.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <Button onClick={handleOpenAdd}>
                  <FaPlus /> Add Question
                </Button>
                <Button className="secondary" onClick={handleResetDefaultQuestions}>
                  <FaRotateLeft /> Reset to Defaults
                </Button>
              </div>
            </div>

            <div className="questions-grid">
              {questionsBank.map((q, index) => (
                <div key={q.id || index} className="question-admin-card glass">
                  <div className="q-card-header">
                    <span className="q-number-badge">Q{index + 1}</span>
                    <h3 className="q-title">{q.title}</h3>
                    <div className="q-actions">
                      <button className="edit-btn" onClick={() => handleOpenEdit(q)} title="Edit Question">
                        <FaPenToSquare />
                      </button>
                      <button className="delete-btn" onClick={() => handleDeleteQuestion(q.id)} title="Delete Question">
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="q-card-body">
                    <div className="q-img-preview-container">
                      <img src={q.image} alt={q.title} className="q-img-preview" onError={(e) => { e.target.src = '/images/q1.jpeg'; }} />
                    </div>
                    <div className="q-details">
                      <div className="q-detail-row">
                        <span className="q-label">Correct Difference Answer:</span>
                        <strong className="q-answer-pill">{q.answer} differences</strong>
                      </div>
                      <div className="q-detail-row">
                        <span className="q-label">Hint text:</span>
                        <p className="q-hint-text">"{q.hint}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* TAB 3: QUIZ CONTROLS & SETTINGS */}
        {activeTab === 'controls' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="controls-panel glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <h2>Quiz Live Event Controls</h2>
              <p style={{ color: '#4d755c', marginBottom: '1.5rem' }}>
                Control live access for students and players joining the Spot the Difference Quiz.
              </p>

              <div className="control-option-card glass" style={{ padding: '1.2rem', borderRadius: '12px', marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1b3831' }}>Quiz Access Status</h3>
                  <p style={{ margin: '0.3rem 0 0 0', color: '#568667', fontSize: '0.9rem' }}>
                    Current state: <b style={{ color: quizStatus === 'active' ? '#10b981' : '#f59e0b', textTransform: 'uppercase' }}>{quizStatus}</b>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <Button
                    className={quizStatus === 'active' ? '' : 'secondary'}
                    onClick={() => handleToggleQuizStatus('active')}
                  >
                    <FaCircleCheck /> Open Quiz (Active)
                  </Button>
                  <Button
                    className={quizStatus === 'paused' ? 'danger-btn' : 'secondary'}
                    onClick={() => handleToggleQuizStatus('paused')}
                  >
                    <FaPause /> Pause Quiz (Maintenance)
                  </Button>
                </div>
              </div>

              <div className="control-option-card glass" style={{ padding: '1.2rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1b3831' }}>Clear Active Live Sessions</h3>
                  <p style={{ margin: '0.3rem 0 0 0', color: '#568667', fontSize: '0.9rem' }}>
                    Reset all in-progress team sessions if restarting a live competition round.
                  </p>
                </div>
                <Button className="secondary" onClick={() => {
                  if (window.confirm('Reset all live active team sessions?')) {
                    localStorage.removeItem('quiz_active_teams');
                    setActiveTeams([]);
                    window.dispatchEvent(new Event('storage'));
                  }
                }}>
                  <FaRotateLeft /> Reset Live Sessions
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* EDIT QUESTION MODAL */}
        <AnimatePresence>
          {editingQuestion && (
            <div className="admin-modal-backdrop">
              <motion.div className="admin-modal glass" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <h2>Edit Question #{editingQuestion.id}</h2>
                <form onSubmit={handleSaveEdit}>
                  <div className="form-group-admin">
                    <label>Title / Category:</label>
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
                  </div>
                  <div className="form-group-admin">
                    <label>Image File Path or URL:</label>
                    <input type="text" value={formImage} onChange={(e) => setFormImage(e.target.value)} required />
                  </div>
                  <div className="form-group-admin">
                    <label>Correct Number of Differences:</label>
                    <input type="number" min="1" max="50" value={formAnswer} onChange={(e) => setFormAnswer(e.target.value)} required />
                  </div>
                  <div className="form-group-admin">
                    <label>Hint Text:</label>
                    <input type="text" value={formHint} onChange={(e) => setFormHint(e.target.value)} required />
                  </div>
                  <div className="modal-actions-admin">
                    <Button type="submit">Save Changes</Button>
                    <Button type="button" className="secondary" onClick={() => setEditingQuestion(null)}>Cancel</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ADD QUESTION MODAL */}
        <AnimatePresence>
          {showAddModal && (
            <div className="admin-modal-backdrop">
              <motion.div className="admin-modal glass" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <h2>Add New Quiz Question</h2>
                <form onSubmit={handleSaveAdd}>
                  <div className="form-group-admin">
                    <label>Title / Category:</label>
                    <input type="text" placeholder="e.g. Garden Scene" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
                  </div>
                  <div className="form-group-admin">
                    <label>Image File Path or URL:</label>
                    <input type="text" placeholder="e.g. /images/q1.jpeg" value={formImage} onChange={(e) => setFormImage(e.target.value)} required />
                  </div>
                  <div className="form-group-admin">
                    <label>Correct Number of Differences:</label>
                    <input type="number" min="1" max="50" value={formAnswer} onChange={(e) => setFormAnswer(e.target.value)} required />
                  </div>
                  <div className="form-group-admin">
                    <label>Hint Text:</label>
                    <input type="text" placeholder="e.g. Look at the flowers and butterflies" value={formHint} onChange={(e) => setFormHint(e.target.value)} required />
                  </div>
                  <div className="modal-actions-admin">
                    <Button type="submit">Add Question</Button>
                    <Button type="button" className="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
