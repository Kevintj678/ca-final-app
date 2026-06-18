import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const P4 = ["Basic concepts","Residence & scope","Income from salaries","Income from house property","PGBP","Capital gains","Income from other sources","Income of other persons","Aggregation of income","Set off & carry forward","Deductions from GTI","Assessment of entities","Transfer pricing","Non-resident taxation","Assessment procedure","Appeals & revision","Settlement commission","Penalties & prosecution","TDS & TCS","Advance tax & interest","Tax planning"];
const P5 = ["GST: Basic concepts","Supply","Charge of GST","Exemptions","Time of supply","Value of supply","Input tax credit","Registration","Tax invoice","Accounts & records","Returns","Payment of tax","Refunds","Assessment & audit","Demands & recovery","Inspection & search","Offences & penalties","Appeals & revision","Customs","FTP overview"];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const STATUSES = ['Not started','In progress','Completed','Revision done'];
const STATUS_COLOR = { 'Not started': '#FCEBEB', 'In progress': '#FAEEDA', 'Completed': '#EAF3DE', 'Revision done': '#E1F5EE' };
const STATUS_TEXT = { 'Not started': '#791F1F', 'In progress': '#633806', 'Completed': '#27500A', 'Revision done': '#085041' };

export default function Dashboard({ profile, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [logs, setLogs] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [logForm, setLogForm] = useState({ date: today(), paper: 'Paper 4 – Direct Tax', topic: '', start_time: '', end_time: '', session_type: 'Study', notes: '' });
  const [ttForm, setTtForm] = useState({ day: 'Monday', paper: 'Paper 4 – Direct Tax', start_time: '', end_time: '', topic: '' });
  const [alert, setAlert] = useState('');

  function today() { return new Date().toISOString().split('T')[0]; }

  useEffect(() => { loadAll(); }, []);

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
    if (existing) {
      await supabase.from('chapter_progress').update({ status }).eq('id', existing.id);
    } else {
      await supabase.from('chapter_progress').insert({ user_id: profile.id, paper, chapter_index: idx, chapter_name: name, status });
    }
    loadAll();
  }

  function getChapterStatus(paper, idx) {
    const c = chapters.find(c => c.paper === paper && c.chapter_index === idx);
    return c ? c.status : 'Not started';
  }

  const totalMins = logs.reduce((a, l) => a + (l.duration_mins || 0), 0);
  const todayMins = logs.filter(l => l.date === today()).reduce((a, l) => a + (l.duration_mins || 0), 0);
  const p4Mins = logs.filter(l => l.paper && l.paper.includes('4')).reduce((a, l) => a + (l.duration_mins || 0), 0);
  const p5Mins = logs.filter(l => l.paper && l.paper.includes('5')).reduce((a, l) => a + (l.duration_mins || 0), 0);
  const daysLeft = Math.ceil((new Date('2026-11-01') - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div>
          <p style={s.headerTitle}>CA Final Planner</p>
          <p style={s.headerSub}>{profile.full_name} · {profile.batch}</p>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>Sign out</button>
      </div>

      <div style={s.tabs}>
        {[['dashboard','🏠 Dashboard'],['log','⏱ Log Session'],['timetable','📅 Timetable'],['chapters','📚 Chapters']].map(([id, label]) => (
          <button key={id} style={{ ...s.tab, ...(tab === id ? s.activeTab : {}) }} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {alert && <div style={s.alert}>{alert}</div>}

      <div style={s.content}>
        {tab === 'dashboard' && (
          <div>
            <div style={s.countdown}>
              <div><p style={s.cdLabel}>Days to Nov 2026</p><p style={s.cdVal}>{daysLeft}</p></div>
              <div style={{ textAlign: 'right' }}><p style={s.cdLabel}>Batch</p><p style={{ fontWeight: 600, color: '#534AB7' }}>{profile.batch}</p></div>
            </div>
            <div style={s.metricGrid}>
              {[['Total studied', fmtDur(totalMins)],['Today', fmtDur(todayMins)],['Paper 4', fmtDur(p4Mins)],['Paper 5', fmtDur(p5Mins)]].map(([l, v]) => (
                <div key={l} style={s.metric}><p style={s.metricVal}>{v}</p><p style={s.metricLbl}>{l}</p></div>
              ))}
            </div>
            <div style={s.card}>
              <p style={s.cardTitle}>Recent sessions</p>
              {logs.slice(0, 5).map(l => (
                <div key={l.id} style={s.logRow}>
                  <div style={s.logDot}></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.logTitle}>{l.topic} <span style={{ ...s.badge, background: l.paper.includes('4') ? '#EEEDFE' : '#E1F5EE', color: l.paper.includes('4') ? '#3C3489' : '#085041' }}>{l.paper.includes('4') ? 'P4' : 'P5'}</span></p>
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
                <Field label="Paper">
                  <select style={s.input} value={logForm.paper} onChange={e => setLogForm(f => ({ ...f, paper: e.target.value }))}>
                    <option>Paper 4 – Direct Tax</option>
                    <option>Paper 5 – Indirect Tax</option>
                  </select>
                </Field>
                <Field label="Topic / Chapter"><input style={s.input} type="text" value={logForm.topic} onChange={e => setLogForm(f => ({ ...f, topic: e.target.value }))} placeholder="e.g. PGBP" /></Field>
              </div>
              <div style={s.row}>
                <Field label="Start time"><input style={s.input} type="time" value={logForm.start_time} onChange={e => setLogForm(f => ({ ...f, start_time: e.target.value }))} /></Field>
                <Field label="End time"><input style={s.input} type="time" value={logForm.end_time} onChange={e => setLogForm(f => ({ ...f, end_time: e.target.value }))} /></Field>
              </div>
              <Field label="Session type">
                <select style={s.input} value={logForm.session_type} onChange={e => setLogForm(f => ({ ...f, session_type: e.target.value }))}>
                  <option>Study</option><option>Revision</option><option>Practice</option><option>Mock</option>
                </select>
              </Field>
              <Field label="Notes (optional)"><textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} placeholder="Key points, doubts..." /></Field>
              <button style={s.btn} onClick={saveLog}>+ Save Session</button>
            </div>
            <div style={s.card}>
              <p style={s.cardTitle}>All sessions</p>
              {logs.map(l => (
                <div key={l.id} style={s.logRow}>
                  <div style={s.logDot}></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.logTitle}>{l.topic} <span style={{ ...s.badge, background: l.paper.includes('4') ? '#EEEDFE' : '#E1F5EE', color: l.paper.includes('4') ? '#3C3489' : '#085041' }}>{l.paper.includes('4') ? 'P4' : 'P5'}</span> <span style={{ ...s.badge, background: '#FAEEDA', color: '#633806' }}>{l.session_type}</span></p>
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
                <Field label="Day">
                  <select style={s.input} value={ttForm.day} onChange={e => setTtForm(f => ({ ...f, day: e.target.value }))}>
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Paper">
                  <select style={s.input} value={ttForm.paper} onChange={e => setTtForm(f => ({ ...f, paper: e.target.value }))}>
                    <option>Paper 4 – Direct Tax</option>
                    <option>Paper 5 – Indirect Tax</option>
                  </select>
                </Field>
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
                      <span style={{ flex: 1, fontSize: 13 }}>{t.topic || t.paper} <span style={{ ...s.badge, background: t.paper.includes('4') ? '#EEEDFE' : '#E1F5EE', color: t.paper.includes('4') ? '#3C3489' : '#085041' }}>{t.paper.includes('4') ? 'P4' : 'P5'}</span></span>
                      <span style={{ fontSize: 12, color: '#888' }}>{fmtDur(t.duration_mins)}</span>
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
                  return (
                    <div key={i} style={s.chRow}>
                      <span style={{ flex: 1, fontSize: 13, color: '#1a1a1a' }}>Ch {i + 1} – {ch}</span>
                      <select style={{ fontSize: 12, border: '1px solid #ddd', borderRadius: 6, padding: '4px 8px', background: STATUS_COLOR[st], color: STATUS_TEXT[st], fontWeight: 500 }}
                        value={st} onChange={e => updateChapter(paper, i, ch, e.target.value)}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4, fontWeight: 500 }}>{label}</label>{children}</div>;
}

const s = {
  app: { minHeight: '100vh', background: '#f5f5f5', maxWidth: 720, margin: '0 auto' },
  header: { background: '#534AB7', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 700 },
  headerSub: { fontSize: 12, opacity: 0.8, marginTop: 2 },
  logoutBtn: { background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13 },
  tabs: { display: 'flex', background: '#fff', borderBottom: '1px solid #eee', overflowX: 'auto' },
  tab: { padding: '12px 16px', fontSize: 13, border: 'none', background: 'none', color: '#666', whiteSpace: 'nowrap', borderBottom: '2px solid transparent' },
  activeTab: { color: '#534AB7', borderBottom: '2px solid #534AB7', fontWeight: 600 },
  content: { padding: 16 },
  alert: { background: '#EAF3DE', color: '#27500A', padding: '10px 16px', fontSize: 13, textAlign: 'center' },
  countdown: { background: '#534AB7', color: '#fff', borderRadius: 14, padding: '20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cdLabel: { fontSize: 12, opacity: 0.8 },
  cdVal: { fontSize: 28, fontWeight: 700 },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 },
  metric: { background: '#fff', borderRadius: 12, padding: '14px', textAlign: 'center' },
  metricVal: { fontSize: 20, fontWeight: 700, color: '#534AB7' },
  metricLbl: { fontSize: 11, color: '#888', marginTop: 4 },
  card: { background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 14 },
  logRow: { display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #f0f0f0' },
  logDot: { width: 8, height: 8, borderRadius: '50%', background: '#534AB7', marginTop: 6, flexShrink: 0 },
  logTitle: { fontSize: 13, fontWeight: 500, color: '#1a1a1a' },
  logMeta: { fontSize: 11, color: '#888', marginTop: 2 },
  badge: { display: 'inline-block', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 500, marginLeft: 4 },
  empty: { color: '#aaa', fontSize: 13, textAlign: 'center', padding: '20px 0' },
  input: { width: '100%', border: '1px solid #e0e0e0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff' },
  btn: { background: '#534AB7', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 600, marginTop: 4 },
  delBtn: { background: 'none', border: 'none', color: '#ccc', fontSize: 14, padding: '2px 6px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  dayHeader: { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  slot: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8f8ff', borderRadius: 8, marginBottom: 6 },
  slotTime: { fontSize: 11, color: '#534AB7', fontWeight: 600, minWidth: 85 },
  chRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
};
