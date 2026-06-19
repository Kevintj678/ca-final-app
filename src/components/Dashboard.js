import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const P4 = ["Basic concepts","Residence & scope","Income from salaries","Income from house property","PGBP","Capital gains","Income from other sources","Income of other persons","Aggregation of income","Set off & carry forward","Deductions from GTI","Assessment of entities","Transfer pricing","Non-resident taxation","Assessment procedure","Appeals & revision","Settlement commission","Penalties & prosecution","TDS & TCS","Advance tax & interest","Tax planning"];
const P5 = ["GST: Basic concepts","Supply","Charge of GST","Exemptions","Time of supply","Value of supply","Input tax credit","Registration","Tax invoice","Accounts & records","Returns","Payment of tax","Refunds","Assessment & audit","Demands & recovery","Inspection & search","Offences & penalties","Appeals & revision","Customs","FTP overview"];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const STATUSES = ['Not started','In progress','Completed','Revision done'];
const STATUS_COLOR = { 'Not started': '#3a1a1a', 'In progress': '#3a2e1a', 'Completed': '#1a3a1a', 'Revision done': '#1a2e3a' };
const STATUS_TEXT = { 'Not started': '#ff6b6b', 'In progress': '#ffd93d', 'Completed': '#6bcb77', 'Revision done': '#4dd9ff' };
const QUOTES = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "Believe you can and you're halfway there.",
  "Your only limit is your mind.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it."
];

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
  const [breakStart, setBreakStart] = useState(null);
  const [breakElapsed, setBreakElapsed] = useState(0);
  const [breakRunning, setBreakRunning] = useState(false);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [signInTime] = useState(new Date());
  const [timeOnApp, setTimeOnApp] = useState(0);
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
        setPomodoroTime(t => {
          if (t <= 1) { clearInterval(pomodoroRef.current); setPomodoroRunning(false); return 0; }
          return t - 1;
        });
      }, 1000);
    } else clearInterval(pomodoroRef.current);
    return () => clearInterval(pomodoroRef.current);
  }, [pomodoroRunning]);

  useEffect(() => {
    if (breakRunning) {
      breakRef.current = setInterval(() => setBreakElapsed(t => t + 1), 1000);
    } else clearInterval(breakRef.current);
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
  function fmtSecs(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
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

  async function saveChapterNote(paper, idx, name, note) {
    const existing = chapters.find(c => c.paper === paper && c.chapter_index === idx);
    if (existing) await supabase.from('chapter_progress').update({ notes: note }).eq('id', existing.id);
    else await supabase.from('chapter_progress').insert({ user_id: profile.id, paper, chapter_index: idx, chapter_name: name, notes: note, status: 'Not started' });
    loadAll();
  }

  function getChapterStatus(paper, idx) {
    const c = chapters.find(c => c.paper === paper && c.chapter_index === idx);
    return c ? c.status : 'Not started';
  }

  function getChapterNote(paper, idx) {
    const c = chapters.find(c => c.paper === paper && c.chapter_index === idx);
    return c ? (c.notes || '') : '';
  }

  function startPomodoro(mode) {
    setPomodoroMode(mode);
    setPomodoroTime(mode === 'study' ? 25 * 60 : mode === 'short' ? 5 * 60 : 15 * 60);
    setPomodoroRunning(true);
  }

  function toggleBreak() {
    if (breakRunning) { setBreakRunning(false); }
    else { setBreakElapsed(0); setBreakRunning(true); }
  }

  const totalMins = logs.reduce((a, l) => a + (l.duration_mins || 0), 0);
  const todayMins = logs.filter(l => l.date === today()).reduce((a, l) => a + (l.duration_mins || 0), 0);
  const p4Mins = logs.filter(l => l.paper && l.paper.includes('4')).reduce((a, l) => a + (l.duration_mins || 0), 0);
  const p5Mins = logs.filter(l => l.paper && l.paper.includes('5')).reduce((a, l) => a + (l.duration_mins || 0), 0);
  const daysLeft = Math.ceil((new Date('2026-11-01') - new Date()) / (1000 * 60 * 60 * 24));
  const p4Done = chapters.filter(c => c.paper.includes('4') && c.status === 'Completed').length;
  const p5Done = chapters.filter(c => c.paper.includes('5') && c.status === 'Completed').length;

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div>
          <p style={s.headerTitle}>📖 CA Final Planner</p>
          <p style={s.headerSub}>{profile.full_name} · {profile.batch} · Signed in at {signInTime.toLocaleTimeString()} · Session: {fmtSecs(timeOnApp)}</p>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>Sign out</button>
      </div>

      <div style={s.tabs}>
        {[['dashboard','🏠'],['log','⏱'],['timetable','📅'],['chapters','📚'],['tools','🛠']].map(([id, icon]) => (
          <button key={id} style={{ ...s.tab, ...(tab === id ? s.activeTab : {}) }} onClick={() => setTab(id)}>{icon} {id.charAt(0).toUpperCase() + id.slice(1)}</button>
        ))}
      </div>

      {alert && <div style={s.alert}>{alert}</div>}

      <div style={s.content}>
        {tab === 'dashboard' && (
          <div>
            <div style={s.quoteBox}>💡 "{quote}"</div>
            <div style={s.countdown}>
              <div><p style={s.cdLabel}>Days to Nov 2026 Exam</p><p style={s.cdVal}>{daysLeft} days left</p></div>
              <div style={{ textAlign: 'right' }}><p style={s.cdLabel}>Batch</p><p style={{ fontWeight: 600, color: '#a78bfa' }}>{profile.batch}</p></div>
            </div>
            <div style={s.metricGrid}>
              {[['📚 Total studied', fmtDur(totalMins)],['⏰ Today', fmtDur(todayMins)],['📄 Paper 4', fmtDur(p4Mins)],['📄 Paper 5', fmtDur(p5Mins)]].map(([l, v]) => (
                <div key={l} style={s.metric}><p style={s.metricVal}>{v}</p><p style={s.metricLbl}>{l}</p></div>
              ))}
            </div>
            <div style={s.metricGrid}>
              {[['✅ P4 chapters done', `${p4Done}/${P4.length}`],['✅ P5 chapters done', `${p5Done}/${P5.length}`],['💧 Water today', `${waterCount} glasses`],['⏱ Session time', fmtSecs(timeOnApp)]].map(([l, v]) => (
                <div key={l} style={s.metric}><p style={s.metricVal}>{v}</p><p style={s.metricLbl}>{l}</p></div>
              ))}
            </div>
            <div style={s.card}>
              <p style={s.cardTitle}>Recent sessions</p>
              {logs.slice(0, 5).map(l => (
                <div key={l.id} style={s.logRow}>
                  <div style={s.logDot}></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.logTitle}>{l.topic} <span style={{ ...s.badge, background: l.paper.includes('4') ? '#2d1b69' : '#1b3a2d', color: l.paper.includes('4') ? '#a78bfa' : '#6ee7b7' }}>{l.paper.includes('4') ? 'P4' : 'P5'}</span></p>
                    <p style={s.logMeta}>{l.date} · {l.start_time}–{l.end_time} · {fmtDur(l.duration_mins)} · {l.session_type}</p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <p style={s.empty}>No sessions logged yet</p>}
            </div>
          </div>
        )}

        {tab === 'log' && (
          <div>
            <div style={s.card}>
              <p style={s.cardTitle}>Log a study session</p>
              <Field label="Date"><input style={s.input} type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} /></Field>
              <div style={s.row}>
                <Field label="Paper"><select style={s.input} value={logForm.paper} onChange={e => setLogForm(f => ({ ...f, paper: e.target.value }))}><option>Paper 4 – Direct Tax</option><option>Paper 5 – Indirect Tax</option></select></Field>
                <Field label="Topic"><input style={s.input} type="text" value={logForm.topic} onChange={e => setLogForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. PGBP" /></Field>
              </div>
              <div style={s.row}>
                <Field label="Start time"><input style={s.input} type="time" value={logForm.start_time} onChange={e => setLogForm(f => ({ ...f, start_time: e.target.value }))} /></Field>
                <Field label="End time"><input style={s.input} type="time" value={logForm.end_time} onChange={e => setLogForm(f => ({ ...f, end_time: e.target.value }))} /></Field>
              </div>
              <Field label="Session type"><select style={s.input} value={logForm.session_type} onChange={e => setLogForm(f => ({ ...f, session_type: e.target.value }))}><option>Study</option><option>Revision</option><option>Practice</option><option>Mock</option></select></Field>
              <Field label="Notes (optional)"><textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} placeholder="Key points, doubts..." /></Field>
              <button style={s.btn} onClick={saveLog}>+ Save Session</button>
            </div>
            <div style={s.card}>
              <p style={s.cardTitle}>All sessions</p>
              {logs.map(l => (
                <div key={l.id} style={s.logRow}>
                  <div style={s.logDot}></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.logTitle}>{l.topic} <span style={{ ...s.badge, background: l.paper.includes('4') ? '#2d1b69' : '#1b3a2d', color: l.paper.includes('4') ? '#a78bfa' : '#6ee7b7' }}>{l.paper.includes('4') ? 'P4' : 'P5'}</span></p>
                    <p style={s.logMeta}>{l.date} · {l.start_time}–{l.end_time} · {fmtDur(l.duration_mins)}</p>
                    {l.notes && <p style={{ ...s.logMeta, fontStyle: 'italic' }}>{l.notes}</p>}
                  </div>
                  <button style={s.delBtn} onClick={() => deleteLog(l.id)}>✕</button>
                </div>
              ))}
              {logs.length === 0 && <p style={s.empty}>No sessions yet</p>}
            </div>
          </div>
        )}

        {tab === 'timetable' && (
          <div>
            <div style={s.card}>
              <p style={s.cardTitle}>Add timetable slot</p>
              <div style={s.row}>
                <Field label="Day"><select style={s.input} value={ttForm.day} onChange={e => setTtForm(f => ({ ...f, day: e.target.value }))}>{DAYS.map(d => <option key={d}>{d}</option>)}</select></Field>
                <Field label="Paper"><select style={s.input} value={ttForm.paper} onChange={e => setTtForm(f => ({ ...f, paper: e.target.value }))}><option>Paper 4 – Direct Tax</option><option>Paper 5 – Indirect Tax</option></select></Field>
              </div>
              <div style={s.row}>
                <Field label="Start"><input style={s.input} type="time" value={ttForm.start_time} onChange={e => setTtForm(f => ({ ...f, start_time: e.target.value }))} /></Field>
                <Field label="End"><input style={s.input} type="time" value={ttForm.end_time} onChange={e => setTtForm(f => ({ ...f, end_time: e.target.value }))} /></Field>
                <Field label="Topic"><input style={s.input} type="text" value={ttForm.topic} onChange={e => setTtForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. PGBP" /></Field>
              </div>
              <button style={s.btn} onClick={saveTT}>+ Add Slot</button>
            </div>
            <div style={s.card}>
              <p style={s.cardTitle}>Weekly timetable</p>
              {DAYS.filter(d => timetable.some(t => t.day === d)).map(day => (
                <div key={day} style={{ marginBottom: 16 }}>
                  <p style={s.dayHeader}>{day}</p>
                  {timetable.filter(t => t.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time)).map(t => (
                    <div key={t.id} style={s.slot}>
                      <span style={s.slotTime}>{t.start_time}–{t.end_time}</span>
                      <span style={{ flex: 1, fontSize: 13, color: '#1a1a2e' }}>{t.topic || t.paper}</span>
                      <span style={{ fontSize: 12, color: '#475569' }}>{fmtDur(t.duration_mins)}</span>
                      <button style={s.delBtn} onClick={() => deleteTT(t.id)}>✕</button>
                    </div>
                  ))}
                </div>
              ))}
              {timetable.length === 0 && <p style={s.empty}>No slots added yet</p>}
            </div>
          </div>
        )}

        {tab === 'chapters' && (
          <div>
            {[['Paper 4 – Direct Tax', P4], ['Paper 5 – Indirect Tax', P5]].map(([paper, chs]) => (
              <div key={paper} style={s.card}>
                <p style={s.cardTitle}>{paper}</p>
                {chs.map((ch, i) => {
                  const st = getChapterStatus(paper, i);
                  const note = getChapterNote(paper, i);
                  return (
                    <div key={i} style={{ ...s.chRow, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        <span style={{ flex: 1, fontSize: 13, color: '#1a1a2e' }}>Ch {i + 1} – {ch}</span>
                        <select style={{ fontSize: 11, border: 'none', borderRadius: 6, padding: '4px 8px', background: STATUS_COLOR[st], color: STATUS_TEXT[st], fontWeight: 600 }}
                          value={st} onChange={e => updateChapter(paper, i, ch, e.target.value)}>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <input style={{ ...s.input, fontSize: 12, padding: '6px 10px' }} placeholder="Add notes for this chapter..." value={note}
                        onChange={e => saveChapterNote(paper, i, ch, e.target.value)} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {tab === 'tools' && (
          <div>
            <div style={s.card}>
              <p style={s.cardTitle}>⏱ Pomodoro Timer</p>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 56, fontWeight: 700, color: pomodoroMode === 'study' ? '#a78bfa' : '#6ee7b7', marginBottom: 16 }}>{fmtSecs(pomodoroTime)}</div>
                <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>{pomodoroMode === 'study' ? '📚 Study session' : pomodoroMode === 'short' ? '☕ Short break' : '🛋 Long break'}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button style={{ ...s.btn, background: '#7c3aed' }} onClick={() => startPomodoro('study')}>▶ Study 25m</button>
                  <button style={{ ...s.btn, background: '#059669' }} onClick={() => startPomodoro('short')}>☕ Break 5m</button>
                  <button style={{ ...s.btn, background: '#0891b2' }} onClick={() => startPomodoro('long')}>🛋 Long 15m</button>
                  <button style={{ ...s.btn, background: '#475569' }} onClick={() => setPomodoroRunning(r => !r)}>{pomodoroRunning ? '⏸ Pause' : '▶ Resume'}</button>
                </div>
              </div>
            </div>

            <div style={s.card}>
              <p style={s.cardTitle}>☕ Break Tracker</p>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: breakRunning ? '#fbbf24' : '#475569', marginBottom: 12 }}>{fmtSecs(breakElapsed)}</div>
                <button style={{ ...s.btn, background: breakRunning ? '#dc2626' : '#d97706' }} onClick={toggleBreak}>
                  {breakRunning ? '⏹ Stop Break' : '☕ Start Break'}
                </button>
              </div>
            </div>

            <div style={s.card}>
              <p style={s.cardTitle}>💧 Water Tracker</p>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{'💧'.repeat(Math.min(waterCount, 8))}</div>
                <p style={{ color: '#475569', fontSize: 13, marginBottom: 16 }}>{waterCount} / 8 glasses today</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button style={{ ...s.btn, background: '#0284c7' }} onClick={() => setWaterCount(w => Math.min(w + 1, 8))}>+ Drink Water</button>
                  <button style={{ ...s.btn, background: '#475569' }} onClick={() => setWaterCount(0)}>Reset</button>
                </div>
              </div>
            </div>

            <div style={s.card}>
              <p style={s.cardTitle}>💡 Today's Motivation</p>
              <div style={{ padding: '16px', background: '#1e1b4b', borderRadius: 10, borderLeft: '3px solid #7c3aed' }}>
                <p style={{ color: '#c4b5fd', fontSize: 15, lineHeight: 1.6, fontStyle: 'italic' }}>"{quote}"</p>
              </div>
            </div>

            <div style={s.card}>
              <p style={s.cardTitle}>📋 Quick Revision Planner</p>
              {[...P4.slice(0,5).map(c => ({ch: c, paper: 'P4'})), ...P5.slice(0,5).map(c => ({ch: c, paper: 'P5'}))].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #ffffff' }}>
                  <span style={{ fontSize: 13, color: '#1a1a2e', flex: 1 }}>{item.paper}: {item.ch}</span>
                  <span style={{ ...s.badge, background: item.paper === 'P4' ? '#2d1b69' : '#1b3a2d', color: item.paper === 'P4' ? '#a78bfa' : '#6ee7b7' }}>{item.paper}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4, fontWeight: 500 }}>{label}</label>{children}</div>;
}

const s = {
  app: { minHeight: '100vh', background: '#f8fafc', maxWidth: 720, margin: '0 auto' },
  header: { background: 'linear-gradient(135deg, #534AB7, #7c3aed)', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 700, color: '#a78bfa' },
  headerSub: { fontSize: 11, opacity: 0.7, marginTop: 2 },
  logoutBtn: { background: 'rgba(167,139,250,0.2)', color: '#a78bfa', border: '1px solid #a78bfa', borderRadius: 8, padding: '6px 14px', fontSize: 13 },
  tabs: { display: 'flex', background: '#ffffff', borderBottom: '1px solid #1a1a2e', overflowX: 'auto' },
  tab: { padding: '12px 14px', fontSize: 12, border: 'none', background: 'none', color: '#475569', whiteSpace: 'nowrap', borderBottom: '2px solid transparent' },
  activeTab: { color: '#a78bfa', borderBottom: '2px solid #a78bfa', fontWeight: 600 },
  content: { padding: 16 },
  alert: { background: '#14532d', color: '#6ee7b7', padding: '10px 16px', fontSize: 13, textAlign: 'center' },
  quoteBox: { background: '#1e1b4b', borderLeft: '3px solid #7c3aed', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#c4b5fd', fontSize: 13, fontStyle: 'italic', lineHeight: 1.5 },
  countdown: { background: 'linear-gradient(135deg, #534AB7, #7c3aed)', borderRadius: 14, padding: '20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cdLabel: { fontSize: 12, color: '#475569' },
  cdVal: { fontSize: 26, fontWeight: 700, color: '#a78bfa' },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 },
  metric: { background: '#ffffff', borderRadius: 12, padding: '14px', textAlign: 'center', border: '1px solid #1a1a2e' },
  metricVal: { fontSize: 18, fontWeight: 700, color: '#a78bfa' },
  metricLbl: { fontSize: 11, color: '#475569', marginTop: 4 },
  card: { background: '#ffffff', borderRadius: 14, padding: '16px', marginBottom: 16, border: '1px solid #1a1a2e' },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#1a1a2e', marginBottom: 14 },
  logRow: { display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #ffffff' },
  logDot: { width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', marginTop: 6, flexShrink: 0 },
  logTitle: { fontSize: 13, fontWeight: 500, color: '#1a1a2e' },
  logMeta: { fontSize: 11, color: '#475569', marginTop: 2 },
  badge: { display: 'inline-block', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 500, marginLeft: 4 },
  empty: { color: '#475569', fontSize: 13, textAlign: 'center', padding: '20px 0' },
  input: { width: '100%', border: '1px solid #1a1a2e', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#f8fafc', color: '#1a1a2e' },
  btn: { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 13, fontWeight: 600, marginTop: 4, cursor: 'pointer' },
  delBtn: { background: 'none', border: 'none', color: '#475569', fontSize: 14, padding: '2px 6px', cursor: 'pointer' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  dayHeader: { fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  slot: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 6, border: '1px solid #1a1a2e' },
  slotTime: { fontSize: 11, color: '#a78bfa', fontWeight: 600, minWidth: 85 },
  chRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #ffffff' },
};