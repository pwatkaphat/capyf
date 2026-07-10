import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-transparent overflow-hidden">
        {session && <Sidebar session={session} />}
        
        <main className={`flex-1 transition-all duration-300 ease-in-out ${session ? 'ml-0 md:ml-64' : ''} h-screen overflow-y-auto`}>
          <Routes>
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/login" replace />} />
            <Route path="/add-device" element={session ? <AddDevice session={session} /> : <Navigate to="/login" replace />} />
            <Route path="/sensor-config" element={session ? <SensorConfig session={session} /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
