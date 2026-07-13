import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddDevice from './pages/AddDevice';
import SensorConfig from './pages/SensorConfig';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="app-loading" role="status" aria-label="กำลังเปิด CapyF">
        <div className="brand-mark brand-mark--large"><span aria-hidden="true">🌱</span></div>
        <p>กำลังพา CapyF ไปดูแลสวน...</p>
        <span className="loading-dots"><i /><i /><i /></span>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-shell">
        {session && <Sidebar session={session} />}
        <main className={session ? 'app-main app-main--signed-in' : 'app-main'}>
          <Routes>
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/login" replace />} />
            <Route path="/add-device" element={session ? <AddDevice session={session} /> : <Navigate to="/login" replace />} />
            <Route path="/sensor-config" element={session ? <SensorConfig session={session} /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
