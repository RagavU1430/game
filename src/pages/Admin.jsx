import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaTrash, FaDownload, FaHouse, FaClock, FaMedal, FaLock, FaKey, FaMagnifyingGlass, FaPlay, FaGamepad, FaTowerBroadcast } from 'react-icons/fa6';
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

export default function Admin({ onHome, onStartGame }) {
  // Persist admin auth session so refresh keeps admin logged in
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('quiz_admin_auth') === 'true';
  });

  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTeams, setActiveTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rank'); // 'rank', 'name', 'time'

  // Default admin passcode is 'admin123'
  const ADMIN_PIN = 'admin123';

  // Fetch live network data from central server and merge with local tab storage
  const syncData = useCallback(async () => {
    let serverLeaderboard = [];
    let serverActive = [];

    try {
      const res = await fetch('/api/admin/live');
      if (res.ok) {
        const data = await res.json();
        serverLeaderboard = Array.isArray(data.leaderboard) ? data.leaderboard : [];
        serverActive = Array.isArray(data.activeTeams) ? data.activeTeams : [];
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

      // Filter out completed teams and stale sessions (> 30 mins)
      const now = Date.now();
      const completedNames = new Set(combinedLeaderboard.map(l => l.teamName));
      const finalActive = Array.from(activeMap.values()).filter(t => {
        if (completedNames.has(t.teamName)) return false;
        if (t.lastActive && (now - t.lastActive > 1800000)) return false;
        return true;
      });

      setLeaderboard(combinedLeaderboard);
      setActiveTeams(finalActive);

      localStorage.setItem('quiz_leaderboard', JSON.stringify(combinedLeaderboard));
      localStorage.setItem('quiz_active_teams', JSON.stringify(finalActive));
    } catch (err) {}
  }, []);

  // Live real-time polling every 1 second
  useEffect(() => {
    syncData();

    const handleStorageChange = () => {
      syncData();
    };

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
    try {
      await fetch('/api/admin/delete-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: teamNameToDelete })
      });
    } catch (e) {}

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

  // Sort and filter leaderboard
  const processedLeaderboard = [...leaderboard]
    .filter(item => item.teamName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.teamName.localeCompare(b.teamName);
      if (sortBy === 'time') return a.time - b.time;
      // Default: Rank by score (desc), then time (asc)
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
            <p className="admin-subtext">Enter the admin passcode to view team results and live sessions.</p>

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
              <span className="live-dot-pulse"></span>
              <span className="live-text"><FaTowerBroadcast /> LIVE EVENT CONTROL</span>
            </div>
            <h1>Leaderboard & Live Monitor</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Button onClick={onStartGame}>
              <FaPlay /> Start New Quiz Round
            </Button>
            <Button className="secondary" onClick={onHome}>
              <FaHouse /> Home Page
            </Button>
          </div>
        </header>

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
            <strong className="stat-value">{bestScore} <small>/ 10</small></strong>
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
                        Question {activeTeam.currentQuestion || 1} / 10 • Current Score: {activeTeam.score || 0}
                      </div>
                    </div>
                  </div>
                  <div className="live-status-tag">
                    <span className="status-dot"></span> In Progress
                  </div>
                  <button
                    className="delete-icon-btn"
                    onClick={() => handleDeleteActiveTeam(activeTeam.teamName)}
                    title="Remove active session"
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
                      <span className="score-badge">{team.score} / 10</span>
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
      </div>
    </>
  );
}
