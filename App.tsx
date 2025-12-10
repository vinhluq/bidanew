import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import SetupMatchScreen from './screens/SetupMatchScreen';
import ScoreboardScreen from './screens/ScoreboardScreen';
import HistoryScreen from './screens/HistoryScreen';
import PracticeScreen from './screens/PracticeScreen';
import ConfigScreen from './screens/ConfigScreen';
import ClubManagerScreen from './screens/ClubManagerScreen';
import { MatchSettings, GameType, GameMode } from './types';
import { DEFAULT_PLAYER_1_NAME, DEFAULT_PLAYER_2_NAME } from './constants';

const App: React.FC = () => {
  // Global State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'club' | 'player' | null>(null);
  
  // Default match settings
  const [matchSettings, setMatchSettings] = useState<MatchSettings>({
    gameType: GameType.CAROM,
    gameMode: GameMode.QUICK,
    numPlayers: 2,
    players: [
      { id: '1', name: DEFAULT_PLAYER_1_NAME },
      { id: '2', name: DEFAULT_PLAYER_2_NAME }
    ]
  });

  const handleLogin = (role: 'club' | 'player', name: string) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  const handleStartMatch = (settings: MatchSettings) => {
    setMatchSettings(settings);
  };

  return (
    <HashRouter>
      <Layout isAuthenticated={isAuthenticated} userRole={userRole} onLogout={handleLogout}>
        <Routes>
          <Route path="/login" element={<LoginScreen onLogin={handleLogin} />} />
          
          {/* Public Routes (Guest Mode) */}
          <Route path="/" element={<HomeScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/practice" element={<PracticeScreen />} />
          
          {/* Protected Routes - accessible by both Players and Club Admins */}
          <Route path="/setup-match" element={
            isAuthenticated ? <SetupMatchScreen onStartMatch={handleStartMatch} userRole={userRole} /> : <Navigate to="/login" replace />
          } />
          
          <Route path="/match" element={
            isAuthenticated ? <ScoreboardScreen settings={matchSettings} /> : <Navigate to="/login" replace />
          } />

          {/* Admin Only Routes - Redirect Players to Home */}
          <Route path="/config" element={
            isAuthenticated && userRole === 'club' ? <ConfigScreen /> : <Navigate to="/" replace />
          } />

          <Route path="/club-manager" element={
            isAuthenticated && userRole === 'club' ? <ClubManagerScreen /> : <Navigate to="/" replace />
          } />

        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;