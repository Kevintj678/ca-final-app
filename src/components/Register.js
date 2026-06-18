import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Register({ onLogin, onBack }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', batch: 'Nov 2026' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleRegister(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email: form.email, password: form.password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: form.full_name,
        email: form.email,
        batch: form.batch,
        role: 'student'
      });
      if (profileError) setError(profileError.message);
      else setSuccess(true);
    }
    setLoading(false);
  }

  if (success) return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>✅</div>
        <h2 style={s.title}>Registration successful!</h2>
        <p style={{ textAlign: 'center', color: '#555', fontSize: 14, marginBottom: 24 }}>Please check your email to verify your account, then sign in.</p>
        <button style={s.btn} onClick={onLogin}>Go to Sign In</button>
      </div>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <button style={s.back} onClick={onBack}>← Back</button>
        <div style={s.logo}>📖</div>
        <h2 style={s.title}>Create account</h2>
        <p style={s.sub}>Join the CA Final Study Planner</p>
        {error && <div style={s.error}>{error}</div>}
        <form onSubmit={handleRegister}>
          <div style={s.field}>
            <label style={s.label}>Full name</label>
            <input style={s.input} type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder="Your full name" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="your@email.com" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Exam batch</label>
            <select style={s.input} value={form.batch} onChange={e => update('batch', e.target.value)}>
              <option>Nov 2026</option>
              <option>May 2027</option>
            </select>
          </div>
          <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
        </form>
        <p style={s.link}>Already have an account? <span style={s.a} onClick={onLogin}>Sign in</span></p>
      </div>
    </div>
  );
}

const s = {
  wrap: { minHeight: '100vh', background: '#f0efff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: '#fff', borderRadius: 16, padding: '40px 32px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(83,74,183,0.1)', position: 'relative' },
  back: { position: 'absolute', top: 20, left: 20, background: 'none', border: 'none', color: '#666', fontSize: 14, cursor: 'pointer' },
  logo: { fontSize: 40, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 700, textAlign: 'center', color: '#1a1a1a', marginBottom: 6 },
  sub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  error: { background: '#FCEBEB', color: '#791F1F', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, color: '#444', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none' },
  btn: { width: '100%', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600, marginTop: 8 },
  link: { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#666' },
  a: { color: '#534AB7', cursor: 'pointer', fontWeight: 500 },
};
