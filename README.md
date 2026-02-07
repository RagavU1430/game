# 🚀 GAME FLOW - QUICK START GUIDE

## Prerequisites
- **Node.js** installed (v16 or higher)
- **npm** package manager

## 🎯 Quick Launch (Easiest Method)

### Option 1: Double-click `launch.bat`
Simply double-click the `launch.bat` file in the project folder. It will:
1. ✅ Check Node.js installation
2. ✅ Install dependencies automatically
3. ✅ Start backend server (port 5000)
4. ✅ Start frontend server (port 3000)

### Option 2: Manual Launch
```bash
# Terminal 1 - Backend Server
node server.js

# Terminal 2 - Frontend Server
npm run dev
```

## 🌐 Access Points

Once both servers are running:

| Role | URL | Description |
|------|-----|-------------|
| **Participant** | http://localhost:3000/game | Join as a player |
| **Host** | http://localhost:3000/leaderboard | Admin dashboard |
| **Landing** | http://localhost:3000 | Home page |

## 📋 How to Use

### For Hosts:
1. Open http://localhost:3000/leaderboard
2. Wait for participants to register
3. Click **"START GLOBAL GAME"** when ready
4. Monitor live leaderboard and violations

### For Participants:
1. Open http://localhost:3000/start-experience
2. Click **"ENTER GAME FLOW"**
3. Enter your name and click **"JOIN SESSION"**
3. Wait for host to start the game
4. Play through 5 levels of tile matching
5. ⚠️ **Don't switch tabs!** Violations are tracked

## 🔧 Troubleshooting

### "Cannot connect to server"
- Make sure backend is running: `node server.js`
- Check if port 5000 is available
- Look for console message: `Server running on port 5000`

### "Frontend not loading"
- Make sure frontend is running: `npm run dev`
- Check if port 3000 is available
- Visit http://localhost:3000

### "WebSocket connection failed"
- The app now has **automatic reconnection**
- Check browser console for connection status
- Look for: ✅ Connected to server

### Dependencies not installed
```bash
npm install
```

## 🎮 Game Features

✅ **5 Levels** - Progressive difficulty  
✅ **Real-time Leaderboard** - Live score updates  
✅ **Tab Detection** - Automatic violation tracking  
✅ **Time-based Scoring** - Faster = Higher score  
✅ **Host Controls** - Start/Reset game globally  
✅ **Auto-reconnect** - Resilient WebSocket connections  

## 🛠️ Technical Details

- **Backend**: Express + WebSocket (port 5000)
- **Frontend**: Next.js 16 (port 3000)
- **Real-time**: WebSocket with auto-reconnect
- **Scoring**: Base score + Time bonus (max 1000)

## 📝 Connection Status

The application now includes:
- ✅ Automatic reconnection every 2 seconds
- ✅ Connection status indicators
- ✅ Console logging for debugging
- ✅ Error handling for network failures

Check browser console for connection messages:
- `✅ Connected to server` - Working properly
- `🔌 Disconnected from server. Reconnecting...` - Auto-reconnecting
- `❌ WebSocket error` - Check server status
