import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminPanel({ profile, onLogout }) {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false });
    const { data: allSessions } = await supabase.from('study_sessions').select('*');
    if (profiles) setStudents(profiles);
    if (allSessions) setSessions(allSessions);
    setLoading(false);
  }

  function studentHours(uid) {
    const mins = sessions.filter(s => s.user_id === uid).reduce((a, s) => a + (s.duration_mins || 0), 0);
    return mins < 60 ? mins + 'm' : Math.floor(mins / 60) + 'h ' + (mins % 60 ? mins % 60 + 'm' : '');
  }

  function studentSessions(uid) { return sessions.filter(s => s.user_id === uid); }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#534AB7' }}>Loading admin panel...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: '#1a1a2e', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700 }}>Admin Panel</p>
          <p style={{ fontSize: 12, opacity: 0.7 }}>CA Final Study Planner</p>
        </div>
        <button style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13 }} onClick={onLogout}>Sign out</button>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[['Total students', students.length], ['Nov 2026 batch', students.filter(s => s.batch === 'Nov 2026').length], ['May 2027 batch', students.filter(s => s.batch === 'May 2027').length]].map(([l, v]) => (
            <div key={l} style={{ background: '#fff', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#534AB7' }}>{v}</p>
              <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{l}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>All students</p>
          {students.length === 0 && <p style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>No students registered yet</p>}
          {students.map(st => (
            <div key={st.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }} onClick={() => setSelected(selected === st.id ? null : st.id)}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#534AB7' }}>
                  {st.full_name ? st.full_name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{st.full_name || 'Unknown'}</p>
                  <p style={{ fontSize: 11, color: '#888' }}>{st.email} · {st.batch}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#534AB7' }}>{studentHours(st.id)}</p>
                  <p style={{ fontSize: 11, color: '#aaa' }}>{studentSessions(st.id).length} sessions</p>
                </div>
                <span style={{ fontSize: 12, color: '#aaa' }}>{selected === st.id ? '▲' : '▼'}</span>
              </div>
              {selected === st.id && (
                <div style={{ background: '#f8f8ff', borderRadius: 10, padding: '12px', margin: '8px 0 12px' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#534AB7', marginBottom: 8 }}>Recent sessions</p>
                  {studentSessions(st.id).slice(0, 5).map(sess => (
                    <div key={sess.id} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#534AB7', marginTop: 5, flexShrink: 0 }}></div>
                      <div>
                        <p style={{ fontSize: 12, color: '#1a1a1a' }}>{sess.topic} <span style={{ color: '#888' }}>· {sess.date} · {sess.duration_mins}m · {sess.session_type}</span></p>
                      </div>
                    </div>
                  ))}
                  {studentSessions(st.id).length === 0 && <p style={{ fontSize: 12, color: '#aaa' }}>No sessions logged yet</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
