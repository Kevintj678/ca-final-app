import React from 'react';

export default function Landing({ onLogin, onRegister }) {
  return (
    <div style={s.wrap}>
      <div style={s.hero}>
        <div style={s.badge}>CA Final 2026</div>
        <h1 style={s.title}>CA Final Study Planner</h1>
        <p style={s.sub}>Track your daily study sessions, manage your timetable, and monitor chapter progress — all in one place.</p>
        <div style={s.btnRow}>
          <button style={s.btnPrimary} onClick={onRegister}>Get Started Free</button>
          <button style={s.btnOutline} onClick={onLogin}>Sign In</button>
        </div>
      </div>
      <div style={s.features}>
        {[
          { icon: '📅', title: 'Daily Tracker', desc: 'Log every study session with time, topic and notes' },
          { icon: '🗓️', title: 'Weekly Timetable', desc: 'Plan your week with a structured study timetable' },
          { icon: '📚', title: 'Chapter Progress', desc: 'Track all chapters for Paper 4 & Paper 5' },
          { icon: '📊', title: 'Study Analytics', desc: 'See your total hours, daily progress and more' },
        ].map((f, i) => (
          <div key={i} style={s.card}>
            <div style={s.icon}>{f.icon}</div>
            <h3 style={s.cardTitle}>{f.title}</h3>
            <p style={s.cardDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
      <div style={s.footer}>
        <p style={{ color: '#888', fontSize: 13 }}>CA Final Study Planner · Built for Nov 2026 & May 2027 batches</p>
      </div>
    </div>
  );
}

const s = {
  wrap: { minHeight: '100vh', background: 'linear-gradient(135deg, #f0efff 0%, #fff 60%)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  hero: { textAlign: 'center', padding: '60px 24px 40px', maxWidth: 560 },
  badge: { display: 'inline-block', background: '#EEEDFE', color: '#534AB7', borderRadius: 20, padding: '4px 16px', fontSize: 13, fontWeight: 500, marginBottom: 16 },
  title: { fontSize: 36, fontWeight: 700, color: '#1a1a1a', marginBottom: 16, lineHeight: 1.2 },
  sub: { fontSize: 16, color: '#555', lineHeight: 1.6, marginBottom: 32 },
  btnRow: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  btnPrimary: { background: '#534AB7', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 32px', fontSize: 15, fontWeight: 600 },
  btnOutline: { background: '#fff', color: '#534AB7', border: '1.5px solid #534AB7', borderRadius: 10, padding: '14px 32px', fontSize: 15, fontWeight: 600 },
  features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, padding: '0 24px 48px', maxWidth: 880, width: '100%' },
  card: { background: '#fff', borderRadius: 14, padding: '24px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', textAlign: 'center' },
  icon: { fontSize: 32, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 1.5 },
  footer: { padding: '0 24px 32px', textAlign: 'center' },
};
