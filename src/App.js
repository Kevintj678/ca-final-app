import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Landing from './components/Landing';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState('landing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); setPage('landing'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setPage('landing');
  }

  if (loading) return (
    <div style={styles.loading}>
      <div style={styles.spinner}></div>
      <p style={{ marginTop: 16, color: '#534AB7', fontWeight: 500 }}>Loading CA Final App...</p>
    </div>
  );

  if (session && profile) {
    if (profile.role === 'admin') return <AdminPanel profile={profile} onLogout={handleLogout} />;
    return <Dashboard profile={profile} onLogout={handleLogout} />;
  }

  if (page === 'login') return <Login onSuccess={() => {}} onRegister={() => setPage('register')} onBack={() => setPage('landing')} />;
  if (page === 'register') return <Register onSuccess={() => {}} onLogin={() => setPage('login')} onBack={() => setPage('landing')} />;
  return <Landing onLogin={() => setPage('login')} onRegister={() => setPage('register')} />;
}

const styles = {
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0efff' },
  spinner: { width: 40, height: 40, border: '3px solid #e0deff', borderTop: '3px solid #534AB7', borderRadius: '50%', animation: 'spin 1s linear infinite' }
};
