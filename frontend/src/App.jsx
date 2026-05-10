import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useRealtime } from './hooks/useRealtime';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  const { deviceState, logs, wsConnected, triggerSOS, testNotification } = useRealtime();
  
  const isDanger = deviceState?.status === 'DANGER';
  const isOffline = !wsConnected || deviceState?.status === 'OFFLINE';
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('auth') === 'true');

  // Listen for logout events
  useEffect(() => {
    const handler = () => setIsLoggedIn(localStorage.getItem('auth') === 'true');
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <div className="w-full">
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />

        {/* Protected Routes */}
        <Route 
          element={
            isLoggedIn ? 
              <Layout isDanger={isDanger} isOffline={isOffline} /> : 
              <Navigate to="/login" replace />
          }
        >
          <Route 
            index 
            element={
              <Dashboard 
                deviceState={deviceState} 
                logs={logs} 
                wsConnected={wsConnected} 
                triggerSOS={triggerSOS} 
                testNotification={testNotification}
                isDanger={isDanger} 
                isOffline={isOffline}
              />
            } 
          />
          <Route 
            path="/alerts" 
            element={<Alerts isDanger={isDanger} deviceState={deviceState} logs={logs} />} 
          />
          <Route 
            path="/profile" 
            element={<Profile deviceState={deviceState} />} 
          />
          <Route 
            path="/settings" 
            element={<Settings />} 
          />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
