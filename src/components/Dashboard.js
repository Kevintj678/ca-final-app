import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const P4 = ["Basic concepts","Residence & scope","Income from salaries","Income from house property","PGBP","Capital gains","Income from other sources","Income of other persons","Aggregation of income","Set off & carry forward","Deductions from GTI","Assessment of entities","Transfer pricing","Non-resident taxation","Assessment procedure","Appeals & revision","Settlement commission","Penalties & prosecution","TDS & TCS","Advance tax & interest","Tax planning"];
const P5 = ["GST: Basic concepts","Supply","Charge of GST","Exemptions","Time of supply","Value of supply","Input tax credit","Registration","Tax invoice","Accounts & records","Returns","Payment of tax","Refunds","Assessment & audit","Demands & recovery","Inspection & search","Offences & penalties","Appeals & revision","Customs","FTP overview"];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const STATUSES = ['Not started','In progress','Completed','Revision done'];
const QUOTES = ["Success is the sum of small efforts, repeated day in and day out.","The secret of getting ahead is getting started.","Don't watch the clock; do what it does. Keep going.","Believe you can and you're halfway there.","Your only limit is your mind.","Push yourself, because no one else is going to do it for you.","Great things never come from comfort zones.","Dream it. Wish it. Do it.","The harder you work for something, the greater you'll feel when you achieve it.","Study hard, for the well is deep and our brains are shallow."];

export default function Dashboard({ profile, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [logForm, setLogForm] = useState({ date: today(), paper: 'Paper 4 – Direct Tax', topic: '', start_time: '', end_time: '', session_type: 'Study', notes: '' });
  const [ttForm, setTtForm] = useState({ day: 'Monday', paper: 'Paper 4 – Direct Tax', start_time: '', end_time: '', topic: '' });
  const [alert, setAlert] = useState('');
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState('study');
  const [waterCount, setWaterCount] = useState(0);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [breakRunning, setBreakRunning] = useState(false);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [signInTime] = useState(new Date());
  const [timeOnApp, setTimeOnApp] = useState(0);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const pomodoroRef = useRef(null);
  const breakRef = useRef(null);
  const appTimeRef = useRef(null);

  function today() { return new Date().toISOString().split('T')[0]; }

  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    appTimeRef.current = setInterval(() => setTimeOnApp(t => t + 1), 1000);
    return () => clearInterval(appTimeRef.current);
  }, []);
  useEffect(() => {
    if (pomodoroRunning) {
      pomodoroRef.current = setInterval(() => {
        setPomodoroTime(t => { if (t <= 1) { clearInterval(pomodoroRef.current); setPomodoroRunning(false); return 0; } return t - 1; });
      }, 1000);
    } else clearInterval(pomodoroRef.current);
    return () => clearInterval(pomodoroRef.current);
  }, [pomodoroRunning]);
  useEffect(() => {
    if (breakRunning) { breakRef.current = setInterval(() => setBreakElapsed(t => t + 1), 1000); }
    else clearInterval(breakRef.current);
    return () => clearInterval(breakRef.current);
  }, [breakRunning]);

  async function loadAll() {
    const uid = profile.id;
    const [l, t, c] = await Promise.all([
      supabase.from('study_sessions').select('*').eq('user_id', uid).order('date', { ascending: false }),
      supabase.from('timetable').select('*').eq('user_id', uid),
      supabase.from('chapter_progress').select('*').eq('user_id', uid)
    ]);
    if (l.data) setLogs(l.data);
    if (t.data) setTimetable(t.data);
    if (c.data) setChapters(c.data);
  }

  function calcDur(s, e) {
    if (!s || !e) return 0;
    const [sh, sm] = s.split(':').map(Number);
    const [eh, em] = e.split(':').map(Number);
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  }
  function fmtDur(m) { return m < 60 ? m + 'm' : Math.floor(m / 60) + 'h ' + (m % 60 ? m % 60 + 'm' : ''); }
  function fmtSecs(s) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
  function showAlert(msg) { setAlert(msg); setTimeout(() => setAlert(''), 3000); }

  async function saveLog() {
    if (!logForm.topic || !logForm.start_time || !logForm.end_time) { showAlert('Please fill all required fields'); return; }
    const dur = calcDur(logForm.start_time, logForm.end_time);
    if (dur <= 0) { showAlert('End time must be after start time'); return; }
    const { error } = await supabase.from('study_sessions').insert({ ...logForm, user_id: profile.id, duration_mins: dur });
    if (!error) { showAlert('✅ Session saved!'); setLogForm(f => ({ ...f, topic: '', start_time: '', end_time: '', notes: '' })); loadAll(); }
  }
  async function saveTT() {
    if (!ttForm.start_time || !ttForm.end_time) { showAlert('Please fill start and end time'); return; }
    const dur = calcDur(ttForm.start_time, ttForm.end_time);
    if (dur <= 0) { showAlert('End time must be after start time'); return; }
    const { error } = await supabase.from('timetable').insert({ ...ttForm, user_id: profile.id, duration_mins: dur });
    if (!error) { showAlert('✅ Slot added!'); setTtForm(f => ({ ...f, start_time: '', end_time: '', topic: '' })); loadAll(); }
  }
  async function deleteLog(id) { await supabase.from('study_sessions').delete().eq('id', id); loadAll(); }
  async function deleteTT(id) { await supabase.from('timetable').delete().eq('id', id); loadAll(); }
  async function updateChapter(paper, idx, name, status) {
    const existing = chapters.find(c => c.paper === paper && c.chapter_index === idx);
    if (existing) await supabase.from('chapter_progress').update({ status }).eq('id', existing.id);
    else await supabase.from('chapter_progress').insert({ user_id: profile.id, paper, chapter_index: idx, chapter_name: name, status });
    loadAll();
  }
  async function updateChapterNote(paper, idx, name, note) {
    const existing = chapters.find(c => c.paper === paper && c.chapter_index === idx);
    if (existing) await supabase.from('chapter_progress').update({ notes: note }).eq('id', existing.id);
    else await supabase.from('chapter_progress').insert({ user_id: profile.id, paper, chapter_index: idx, chapter_name: name, notes: note, status: 'Not started' });
  }
  function getChapterStatus(paper, idx) { const c = chapters.find(c => c.paper === paper && c.chapter_index === idx); return c ? c.status : 'Not started'; }
  function getChapterNote(paper, idx) { const c = chapters.find(c => c.paper === paper && c.chapter_index === idx); return c ? (c.notes || '') : ''; }

  const totalMins = logs.reduce((a, l) => a + (l.duration_mins || 0), 0);
  const todayMins = logs.filter(l => l.date === today()).reduce((a, l) => a + (l.duration_mins || 0), 0);
  const p4Mins = logs.filter(l => l.paper && l.paper.includes('4')).reduce((a, l) => a + (l.duration_mins || 0), 0);
  const p5Mins = logs.filter(l => l.paper && l.paper.includes('5')).reduce((a, l) => a + (l.duration_mins || 0), 0);
  const daysLeft = Math.ceil((new Date('2026-11-01') - new Date()) / (1000 * 60 * 60 * 24));
  const p4Done = chapters.filter(c => c.paper.includes('4') && c.status === 'Completed').length;
  const p5Done = chapters.filter(c => c.paper.includes('5') && c.status === 'Completed').length;

  const statusColors = { 'Not started': { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' }, 'In progress': { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' }, 'Completed': { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' }, 'Revision done': { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' } };

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a3c5e 0%, #2d6a9f 100%)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>📖</span>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>CA Final Study Planner</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>{profile.full_name} · {profile.batch} · {signInTime.toLocaleTimeString()} · {fmtSecs(timeOnApp)}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '6px 16px', fontSize: 13, cursor: 'pointer' }}>Sign out</button>
      </div>

      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 24px', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {[['dashboard', '🏠', 'Dashboard'], ['log', '⏱', 'Log Session'], ['timetable', '📅', 'Timetable'], ['chapters', '📚', 'Chapters'], ['tools', '🛠', 'Tools']].map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '14px 20px', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', color: tab === id ? '#1a3c5e' : '#6B7280', borderBottom: tab === id ? '2px solid #1a3c5e' : '2px solid transparent', fontWeight: tab === id ? 600 : 400, whiteSpace: 'nowrap' }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {alert && <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 24px', fontSize: 13, borderBottom: '1px solid #A7F3D0' }}>{alert}</div>}

      <div style={{ padding: '20px 24px', maxWidth: 900, margin: '0 auto' }}>

        {tab === 'dashboard' && (
          <div>
            {/* Quote */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderLeft: '4px solid #2d6a9f', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <p style={{ color: '#374151', fontSize: 13, fontStyle: 'italic', margin: 0 }}>💡 "{quote}"</p>
            </div>

            {/* Exam countdown */}
            <div style={{ background: 'linear-gradient(135deg, #1a3c5e, #2d6a9f)', borderRadius: 10, padding: '20px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '0 0 4px' }}>Days to Nov 2026 Exam</p>
                <p style={{ color: '#fff', fontSize: 32, fontWeight: 700, margin: 0 }}>{daysLeft} <span style={{ fontSize: 16, fontWeight: 400 }}>days left</span></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '0 0 4px' }}>Batch</p>
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 }}>{profile.batch}</p>
              </div>
            </div>

            {/* Metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { icon: '📚', label: 'Total Studied', value: fmtDur(totalMins), color: '#2d6a9f' },
                { icon: '⏰', label: 'Today', value: fmtDur(todayMins), color: '#059669' },
                { icon: '📄', label: 'Paper 4', value: fmtDur(p4Mins), color: '#7C3AED' },
                { icon: '📄', label: 'Paper 5', value: fmtDur(p5Mins), color: '#DB2777' },
                { icon: '✅', label: 'P4 Chapters', value: `${p4Done}/${P4.length}`, color: '#D97706' },
                { icon: '✅', label: 'P5 Chapters', value: `${p5Done}/${P5.length}`, color: '#0891B2' },
                { icon: '💧', label: 'Water Today', value: `${waterCount} glasses`, color: '#2563EB' },
                { icon: '⏱', label: 'Session Time', value: fmtSecs(timeOnApp), color: '#16A34A' },
              ].map((m, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: m.color, margin: '0 0 4px' }}>{m.value}</p>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{m.label}</p>
                </div>
              ))}
            </div>

            {/* Recent sessions */}
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Recent Sessions</p>
              {logs.slice(0, 5).map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: l.paper.includes('4') ? '#EEF2FF' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{l.paper.includes('4') ? '📘' : '📗'}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: '0 0 2px' }}>{l.topic}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{l.date} · {l.start_time}–{l.end_time} · {fmtDur(l.duration_mins)} · {l.session_type}</p>
                  </div>
                  <span style={{ fontSize: 11, background: l.paper.includes('4') ? '#EEF2FF' : '#F0FDF4', color: l.paper.includes('4') ? '#4338CA' : '#16A34A', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>{l.paper.includes('4') ? 'P4' : 'P5'}</span>
                </div>
              ))}
              {logs.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No sessions logged yet</p>}
            </div>
          </div>
        )}

        {tab === 'log' && (
          <div>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Log a Study Session</p>
              <Field label="Date"><input style={inp} type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Paper"><select style={inp} value={logForm.paper} onChange={e => setLogForm(f => ({ ...f, paper: e.target.value }))}><option>Paper 4 – Direct Tax</option><option>Paper 5 – Indirect Tax</option></select></Field>
                <Field label="Topic"><input style={inp} type="text" value={logForm.topic} onChange={e => setLogForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. PGBP" /></Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Start time"><input style={inp} type="time" value={logForm.start_time} onChange={e => setLogForm(f => ({ ...f, start_time: e.target.value }))} /></Field>
                <Field label="End time"><input style={inp} type="time" value={logForm.end_time} onChange={e => setLogForm(f => ({ ...f, end_time: e.target.value }))} /></Field>
              </div>
              <Field label="Session type"><select style={inp} value={logForm.session_type} onChange={e => setLogForm(f => ({ ...f, session_type: e.target.value }))}><option>Study</option><option>Revision</option><option>Practice</option><option>Mock</option></select></Field>
              <Field label="Notes (optional)"><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} placeholder="Key points, doubts..." /></Field>
              <button style={btnPrimary} onClick={saveLog}>+ Save Session</button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>All Sessions</p>
              {logs.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: l.paper.includes('4') ? '#EEF2FF' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{l.paper.includes('4') ? '📘' : '📗'}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: '0 0 2px' }}>{l.topic}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{l.date} · {l.start_time}–{l.end_time} · {fmtDur(l.duration_mins)} · {l.session_type}</p>
                    {l.notes && <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0', fontStyle: 'italic' }}>{l.notes}</p>}
                  </div>
                  <button onClick={() => deleteLog(l.id)} style={{ background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer', fontSize: 16 }}>✕</button>
                </div>
              ))}
              {logs.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 20 }}>No sessions yet</p>}
            </div>
          </div>
        )}

        {tab === 'timetable' && (
          <div>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>Add Timetable Slot</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Day"><select style={inp} value={ttForm.day} onChange={e => setTtForm(f => ({ ...f, day: e.target.value }))}>{DAYS.map(d => <option key={d}>{d}</option>)}</select></Field>
                <Field label="Paper"><select style={inp} value={ttForm.paper} onChange={e => setTtForm(f => ({ ...f, paper: e.target.value }))}><option>Paper 4 – Direct Tax</option><option>Paper 5 – Indirect Tax</option></select></Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Start"><input style={inp} type="time" value={ttForm.start_time} onChange={e => setTtForm(f => ({ ...f, start_time: e.target.value }))} /></Field>
                <Field label="End"><input style={inp} type="time" value={ttForm.end_time} onChange={e => setTtForm(f => ({ ...f, end_time: e.target.value }))} /></Field>
                <Field label="Topic"><input style={inp} type="text" value={ttForm.topic} onChange={e => setTtForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. PGBP" /></Field>
              </div>
              <button style={btnPrimary} onClick={saveTT}>+ Add Slot</button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Weekly Timetable</p>
              {DAYS.filter(d => timetable.some(t => t.day === d)).map(day => (
                <div key={day} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{day}</p>
                  {timetable.filter(t => t.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time)).map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, marginBottom: 6, border: '1px solid #E5E7EB' }}>
                      <span style={{ fontSize: 12, color: '#1a3c5e', fontWeight: 600, minWidth: 90 }}>{t.start_time}–{t.end_time}</span>
                      <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{t.topic || t.paper}</span>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{fmtDur(t.duration_mins)}</span>
                      <button onClick={() => deleteTT(t.id)} style={{ background: 'none', border: 'none', color: '#D1D5DB', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              ))}
              {timetable.length === 0 && <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 20 }}>No slots added yet</p>}
            </div>
          </div>
        )}

        {tab === 'chapters' && (
          <div>
            {[['Paper 4 – Direct Tax', P4], ['Paper 5 – Indirect Tax', P5]].map(([paper, chs]) => (
              <div key={paper} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>{paper}</p>
                {chs.map((ch, i) => {
                  const st = getChapterStatus(paper, i);
                  const sc = statusColors[st];
                  const key = `${paper}-${i}`;
                  const expanded = expandedChapter === key;
                  return (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer' }} onClick={() => setExpandedChapter(expanded ? null : key)}>
                        <span style={{ fontSize: 12, color: '#9CA3AF', minWidth: 24 }}>Ch {i + 1}</span>
                        <span style={{ flex: 1, fontSize: 13, color: '#374151', fontWeight: 500 }}>{ch}</span>
                        <select style={{ fontSize: 11, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '3px 8px', background: sc.bg, color: sc.text, fontWeight: 600, cursor: 'pointer' }}
                          value={st} onClick={e => e.stopPropagation()} onChange={e => updateChapter(paper, i, ch, e.target.value)}>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{expanded ? '▲' : '▼'}</span>
                      </div>
                      {expanded && (
                        <div style={{ padding: '10px 12px', background: '#fff', border: '1px solid #E5E7EB', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                          <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>📝 Notes for this chapter:</label>
                          <textarea style={{ ...inp, minHeight: 80, resize: 'vertical', fontSize: 12 }} placeholder="Add your notes, key points, important formulas..." defaultValue={getChapterNote(paper, i)}
                            onBlur={e => updateChapterNote(paper, i, ch, e.target.value)} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {tab === 'tools' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>⏱ Pomodoro Timer</p>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 52, fontWeight: 700, color: pomodoroMode === 'study' ? '#1a3c5e' : '#059669', marginBottom: 8, fontFamily: 'monospace' }}>{fmtSecs(pomodoroTime)}</div>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>{pomodoroMode === 'study' ? '📚 Study session' : pomodoroMode === 'short' ? '☕ Short break' : '🛋 Long break'}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button style={{ ...btnPrimary, padding: '8px 14px', fontSize: 12 }} onClick={() => { setPomodoroMode('study'); setPomodoroTime(25 * 60); setPomodoroRunning(true); }}>📚 25m</button>
                  <button style={{ ...btnPrimary, padding: '8px 14px', fontSize: 12, background: '#059669' }} onClick={() => { setPomodoroMode('short'); setPomodoroTime(5 * 60); setPomodoroRunning(true); }}>☕ 5m</button>
                  <button style={{ ...btnPrimary, padding: '8px 14px', fontSize: 12, background: '#0891B2' }} onClick={() => { setPomodoroMode('long'); setPomodoroTime(15 * 60); setPomodoroRunning(true); }}>🛋 15m</button>
                  <button style={{ ...btnPrimary, padding: '8px 14px', fontSize: 12, background: '#6B7280' }} onClick={() => setPomodoroRunning(r => !r)}>{pomodoroRunning ? '⏸ Pause' : '▶ Resume'}</button>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>☕ Break Tracker</p>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 44, fontWeight: 700, color: breakRunning ? '#D97706' : '#9CA3AF', marginBottom: 12, fontFamily: 'monospace' }}>{fmtSecs(breakElapsed)}</div>
                <button style={{ ...btnPrimary, background: breakRunning ? '#DC2626' : '#D97706' }} onClick={() => { if (breakRunning) setBreakRunning(false); else { setBreakElapsed(0); setBreakRunning(true); } }}>
                  {breakRunning ? '⏹ Stop Break' : '☕ Start Break'}
                </button>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>💧 Water Tracker</p>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 8, letterSpacing: 4 }}>{'💧'.repeat(waterCount)}{'○'.repeat(Math.max(0, 8 - waterCount))}</div>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>{waterCount} / 8 glasses today</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button style={{ ...btnPrimary, background: '#0284C7' }} onClick={() => setWaterCount(w => Math.min(w + 1, 8))}>+ Drink Water</button>
                  <button style={{ ...btnPrimary, background: '#6B7280' }} onClick={() => setWaterCount(0)}>Reset</button>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderLeft: '4px solid #1a3c5e', borderRadius: 8, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 12 }}>💡 Today's Motivation</p>
              <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6, fontStyle: 'italic' }}>"{quote}"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 4, fontWeight: 500 }}>{label}</label>{children}</div>;
}

const inp = { width: '100%', border: '1px solid #D1D5DB', borderRadius: 6, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#111827', boxSizing: 'border-box' };
const btnPrimary = { background: '#1a3c5e', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };