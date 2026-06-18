import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ onLogin, onRegister, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>📖</div>
        <h2 style={s.title}>Welcome back</h2>
        <p style={s.sub}>Sign in to your CA Final Planner</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p style={s.link}>Don't have an account? <span style={s.a} onClick={onRegister}>Register here</span></p>
      </div>
    </div>
  );
}

const s = {
  wrap: { minHeight: '100vh', background: '#f0efff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: '#fff', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 400, boxShadow: '0 4px 24px rgba(83,74,183,0.1)', position: 'relative' },
  back: { position: 'absolute', top: 20, left: 20, background: 'none', border: 'none', color: '#666', fontSize: 14, cursor: 'pointer' },
  logo: { fontSize: 40, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, textAlign: 'center', color: '#1a1a1a', marginBottom: 6 },
  sub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  error: { background: '#FCEBEB', color: '#791F1F', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, color: '#444', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none' },
  btn: { width: '100%', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600, marginTop: 8 },
  link: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#666' },
  a: { color: '#534AB7', cursor: 'pointer', fontWeight: 500 },
};
