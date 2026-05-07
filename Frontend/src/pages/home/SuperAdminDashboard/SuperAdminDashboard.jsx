import { useState, useEffect } from 'react';
import { getTeachers, getStudents, getClassrooms, getSubjects, createAdmin } from '../../../services/dashboardApi';

// ── Inline SVG Icons ──────────────────────────────────────────────
const Icon = {
  Grid: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  UserPlus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  ),
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Door: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Book: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Loader: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin 1s linear infinite'}}>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  Server: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  ),
  Activity: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Graduation: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  ),
  FileText: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Shield: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',     Icon: Icon.Grid },
  { id: 'create-admin',  label: 'Create Admin',  Icon: Icon.UserPlus },
  { id: 'users',         label: 'All Users',     Icon: Icon.Users },
  { id: 'classrooms',    label: 'Classrooms',    Icon: Icon.Door },
  { id: 'subjects',      label: 'Subjects',      Icon: Icon.Book },
  { id: 'reports',       label: 'Reports',       Icon: Icon.BarChart },
];

// ── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ label, value, accent }) => (
  <div style={{
    background: '#fff',
    border: `1px solid ${accent}33`,
    borderRadius: 16,
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: `0 2px 12px ${accent}18`,
  }}>
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent }}>{label}</span>
    <span style={{ fontSize: 42, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>{value}</span>
  </div>
);

// ── User Card ─────────────────────────────────────────────────────
const UserCard = ({ user, role, accent }) => (
  <div style={{
    background: '#fff',
    border: `1px solid #e2e8f0`,
    borderRadius: 14,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    transition: 'box-shadow 0.2s, border-color 0.2s',
    cursor: 'default',
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${accent}22`; e.currentTarget.style.borderColor = `${accent}55`; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: `${accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent, fontWeight: 800, fontSize: 15,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {user.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, margin: 0 }}>{user.name}</p>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0', fontFamily: "'DM Mono', monospace" }}>{user.email}</p>
        </div>
      </div>
      <span style={{
        padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
        background: `${accent}15`, color: accent, letterSpacing: '0.05em',
      }}>{role}</span>
    </div>
    {user.branch && (
      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
        Branch: <strong style={{ color: '#334155' }}>{user.branch}</strong>
      </span>
    )}
    <button style={{
      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
      color: accent, fontSize: 12, fontWeight: 700,
      display: 'flex', alignItems: 'center', gap: 4,
      letterSpacing: '0.03em',
    }}>
      View Details <Icon.ChevronRight />
    </button>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────
const SuperAdminDashboard = () => {
  const [section, setSection] = useState('dashboard');
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', branch: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const branches = ['CSE', 'CIVIL', 'MECH', 'CSE(AIML)', 'ENTC', 'MBA', 'BSH'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [t, s, c, sub] = await Promise.all([getTeachers(), getStudents(), getClassrooms(), getSubjects()]);
        setTeachers(t || []); setStudents(s || []); setClassrooms(c || []); setSubjects(sub || []);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.branch) { setError('Please select a branch'); return; }
    try {
      setSubmitting(true); setError(null);
      await createAdmin(adminForm);
      setSuccess('Admin created successfully!');
      setAdminForm({ name: '', email: '', password: '', branch: '' });
      setTimeout(() => setSuccess(null), 3500);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', color: '#0369a1' }}>
        <Icon.Loader />
        <p style={{ marginTop: 16, fontWeight: 600, color: '#475569', fontFamily: "'DM Sans', sans-serif" }}>Loading system data…</p>
      </div>
    </div>
  );

  const currentNav = NAV_ITEMS.find(n => n.id === section);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        .sa-input {
          width: 100%; padding: 12px 16px;
          border: 1.5px solid #cbd5e1; border-radius: 10px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #0f172a; background: #f8fafc;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .sa-input:focus { border-color: #0284c7; background: #fff; box-shadow: 0 0 0 3px #0284c722; }
        .sa-input::placeholder { color: #94a3b8; }
        .sa-select { appearance: none; cursor: pointer; }
        .sa-btn-primary {
          width: 100%; padding: 13px 24px;
          background: linear-gradient(135deg, #0369a1, #0284c7);
          color: #fff; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif;
          cursor: pointer; letter-spacing: 0.03em;
          transition: opacity 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 14px #0284c730;
        }
        .sa-btn-primary:hover:not(:disabled) { opacity: 0.9; box-shadow: 0 6px 20px #0284c745; }
        .sa-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .sa-section { animation: fadeIn 0.25s ease; }
        .sa-nav-item { transition: background 0.15s, color 0.15s; }
        .sa-resource-card { transition: box-shadow 0.2s, border-color 0.2s; }
        .sa-resource-card:hover { box-shadow: 0 4px 20px #0284c718 !important; border-color: #7dd3fc !important; }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside style={{
          width: 240, minHeight: '100vh',
          background: '#0f172a',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#38bdf8' }}>
              <Icon.Shield />
              <div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: '#f8fafc', lineHeight: 1 }}>SuperAdmin</p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 3, fontWeight: 500, letterSpacing: '0.06em' }}>CONTROL PANEL</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav style={{ flex: 1, padding: '16px 12px' }}>
            {NAV_ITEMS.map(({ id, label, Icon: NavIcon }) => {
              const active = section === id;
              return (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className="sa-nav-item"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10, border: 'none',
                    background: active ? '#1e3a5f' : 'transparent',
                    color: active ? '#38bdf8' : '#94a3b8',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14, fontWeight: active ? 700 : 500,
                    cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                    letterSpacing: '0.01em',
                    borderLeft: active ? '3px solid #38bdf8' : '3px solid transparent',
                  }}
                >
                  <NavIcon />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #1e293b' }}>
            <p style={{ fontSize: 11, color: '#334155', fontWeight: 500 }}>System v2.1.0</p>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────── */}
        <main style={{ flex: 1, padding: '40px 48px', maxWidth: 1100, overflowY: 'auto' }}>

          {/* Page Header */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#0284c7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              {currentNav?.label}
            </p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              {section === 'dashboard' && 'System Overview'}
              {section === 'create-admin' && 'Create New Admin'}
              {section === 'users' && 'User Management'}
              {section === 'classrooms' && 'Classroom Directory'}
              {section === 'subjects' && 'Subject Catalogue'}
              {section === 'reports' && 'Analytics & Reports'}
            </h1>
          </div>

          {/* Alerts */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'#fef2f2', border:'1.5px solid #fca5a5', borderRadius:12, padding:'14px 18px', marginBottom:20, color:'#b91c1c' }}>
              <Icon.AlertCircle /><span style={{ fontWeight:600, fontSize:14 }}>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:12, padding:'14px 18px', marginBottom:20, color:'#15803d' }}>
              <Icon.CheckCircle /><span style={{ fontWeight:600, fontSize:14 }}>{success}</span>
            </div>
          )}

          <div className="sa-section" key={section}>

            {/* ── DASHBOARD ── */}
            {section === 'dashboard' && (
              <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
                  <StatCard label="Total Users"  value={teachers.length + students.length} accent="#0284c7" />
                  <StatCard label="Teachers"     value={teachers.length}                   accent="#7c3aed" />
                  <StatCard label="Students"     value={students.length}                   accent="#059669" />
                  <StatCard label="Classrooms"   value={classrooms.length}                 accent="#d97706" />
                </div>

                <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:28 }}>
                  <h3 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:18, color:'#0f172a', marginBottom:20 }}>System Status</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    {[
                      { label: 'Database Connection', status: 'Connected', Icon: Icon.Server },
                      { label: 'API Server', status: 'Running',   Icon: Icon.Activity },
                    ].map(({ label, status, Icon: SI }) => (
                      <div key={label} style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'14px 18px', background:'#f0fdf4',
                        border:'1px solid #bbf7d0', borderRadius:12,
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, color:'#0f172a', fontWeight:600, fontSize:14 }}>
                          <SI />{label}
                        </div>
                        <span style={{
                          padding:'4px 12px', borderRadius:99, fontSize:12, fontWeight:700,
                          background:'#dcfce7', color:'#15803d',
                        }}>{status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent activity placeholder */}
                <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:28 }}>
                  <h3 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:18, color:'#0f172a', marginBottom:6 }}>Quick Summary</h3>
                  <p style={{ color:'#64748b', fontSize:14, lineHeight:1.7 }}>
                    You have <strong style={{color:'#0f172a'}}>{teachers.length}</strong> teachers and <strong style={{color:'#0f172a'}}>{students.length}</strong> students
                    across <strong style={{color:'#0f172a'}}>{classrooms.length}</strong> classrooms with <strong style={{color:'#0f172a'}}>{subjects.length}</strong> subjects currently active in the system.
                  </p>
                </div>
              </div>
            )}

            {/* ── CREATE ADMIN ── */}
            {section === 'create-admin' && (
              <div style={{ maxWidth:520 }}>
                <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:18, padding:'36px 36px' }}>
                  <p style={{ color:'#64748b', fontSize:14, lineHeight:1.7, marginBottom:28 }}>
                    Fill in the details below to provision a new branch administrator account.
                  </p>
                  <form onSubmit={handleCreateAdmin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    <div>
                      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#334155', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Full Name</label>
                      <input className="sa-input" type="text" placeholder="e.g. Rahul Sharma" value={adminForm.name}
                        onChange={e => setAdminForm({...adminForm, name: e.target.value})} required />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#334155', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Email Address</label>
                      <input className="sa-input" type="email" placeholder="admin@college.edu" value={adminForm.email}
                        onChange={e => setAdminForm({...adminForm, email: e.target.value})} required />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#334155', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Password</label>
                      <input className="sa-input" type="password" placeholder="Min. 8 characters" value={adminForm.password}
                        onChange={e => setAdminForm({...adminForm, password: e.target.value})} required />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#334155', marginBottom:6, letterSpacing:'0.05em', textTransform:'uppercase' }}>Branch</label>
                      <div style={{ position:'relative' }}>
                        <select className="sa-input sa-select" value={adminForm.branch}
                          onChange={e => setAdminForm({...adminForm, branch: e.target.value})} required>
                          <option value="">— Select a Branch —</option>
                          {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#94a3b8' }}>
                          <Icon.ChevronRight />
                        </span>
                      </div>
                    </div>
                    <div style={{ marginTop:8 }}>
                      <button className="sa-btn-primary" type="submit" disabled={submitting}>
                        {submitting ? 'Creating account…' : 'Create Admin Account'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {section === 'users' && (
              <div style={{ display:'flex', flexDirection:'column', gap:36 }}>
                {/* Teachers */}
                <section>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <Icon.Users />
                    <h2 style={{ fontFamily:"'Syne', sans-serif", fontSize:20, fontWeight:800, color:'#0f172a' }}>
                      Teachers <span style={{ fontSize:14, color:'#94a3b8', fontFamily:"'DM Sans', sans-serif", fontWeight:500 }}>({teachers.length})</span>
                    </h2>
                  </div>
                  {teachers.length === 0
                    ? <p style={{ color:'#94a3b8', fontSize:14 }}>No teachers found.</p>
                    : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
                        {teachers.map(t => <UserCard key={t._id} user={t} role="Teacher" accent="#7c3aed" />)}
                      </div>
                  }
                </section>
                {/* Students */}
                <section>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <Icon.Graduation />
                    <h2 style={{ fontFamily:"'Syne', sans-serif", fontSize:20, fontWeight:800, color:'#0f172a' }}>
                      Students <span style={{ fontSize:14, color:'#94a3b8', fontFamily:"'DM Sans', sans-serif", fontWeight:500 }}>({students.length})</span>
                    </h2>
                  </div>
                  {students.length === 0
                    ? <p style={{ color:'#94a3b8', fontSize:14 }}>No students found.</p>
                    : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
                        {students.map(s => <UserCard key={s._id} user={s} role="Student" accent="#059669" />)}
                      </div>
                  }
                </section>
              </div>
            )}

            {/* ── CLASSROOMS ── */}
            {section === 'classrooms' && (
              <div>
                <p style={{ color:'#64748b', fontSize:14, marginBottom:20 }}>
                  {classrooms.length} classroom{classrooms.length !== 1 ? 's' : ''} registered in the system.
                </p>
                {classrooms.length === 0
                  ? <p style={{ color:'#94a3b8', fontSize:14 }}>No classrooms found.</p>
                  : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                      {classrooms.map(c => (
                        <div key={c._id} className="sa-resource-card" style={{
                          background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:22,
                        }}>
                          <h4 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:17, color:'#0f172a', marginBottom:6 }}>{c.name}</h4>
                          <p style={{ color:'#64748b', fontSize:13, lineHeight:1.6, marginBottom:18 }}>{c.description || 'No description provided.'}</p>
                          <div style={{ display:'flex', gap:8 }}>
                            <button style={{
                              flex:1, padding:'9px 0', border:'1.5px solid #0284c7', borderRadius:8,
                              background:'#f0f9ff', color:'#0284c7', fontSize:13, fontWeight:700,
                              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                            }}><Icon.Edit />Edit</button>
                            <button style={{
                              flex:1, padding:'9px 0', border:'1.5px solid #fca5a5', borderRadius:8,
                              background:'#fff5f5', color:'#dc2626', fontSize:13, fontWeight:700,
                              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                            }}><Icon.Trash />Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

            {/* ── SUBJECTS ── */}
            {section === 'subjects' && (
              <div>
                <p style={{ color:'#64748b', fontSize:14, marginBottom:20 }}>
                  {subjects.length} subject{subjects.length !== 1 ? 's' : ''} available across all branches.
                </p>
                {subjects.length === 0
                  ? <p style={{ color:'#94a3b8', fontSize:14 }}>No subjects found.</p>
                  : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                      {subjects.map(s => (
                        <div key={s._id} className="sa-resource-card" style={{
                          background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:22,
                        }}>
                          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                            <h4 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:17, color:'#0f172a' }}>{s.name}</h4>
                            <span style={{
                              padding:'4px 10px', background:'#faf5ff', color:'#7c3aed',
                              borderRadius:99, fontSize:11, fontWeight:700, letterSpacing:'0.06em',
                              fontFamily:"'DM Mono', monospace",
                            }}>{s.code}</span>
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button style={{
                              flex:1, padding:'9px 0', border:'1.5px solid #7c3aed', borderRadius:8,
                              background:'#faf5ff', color:'#7c3aed', fontSize:13, fontWeight:700,
                              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                            }}><Icon.Edit />Edit</button>
                            <button style={{
                              flex:1, padding:'9px 0', border:'1.5px solid #fca5a5', borderRadius:8,
                              background:'#fff5f5', color:'#dc2626', fontSize:13, fontWeight:700,
                              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                            }}><Icon.Trash />Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

            {/* ── REPORTS ── */}
            {section === 'reports' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <p style={{ color:'#64748b', fontSize:14 }}>Generate and export system reports for administrative review.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:700 }}>
                  {[
                    { title:'Attendance Overview', desc:'Generate attendance reports for specific periods and classrooms.', Icon: Icon.FileText, color:'#0284c7' },
                    { title:'User Activity Logs', desc:'View detailed login, session, and action logs for all users.', Icon: Icon.Activity, color:'#7c3aed' },
                  ].map(({ title, desc, Icon: RI, color }) => (
                    <div key={title} style={{
                      background:'#fff', border:'1px solid #e2e8f0', borderRadius:16, padding:26,
                      display:'flex', flexDirection:'column', gap:12,
                    }}>
                      <div style={{ color, marginBottom:4 }}><RI /></div>
                      <h4 style={{ fontFamily:"'Syne', sans-serif", fontWeight:800, fontSize:17, color:'#0f172a' }}>{title}</h4>
                      <p style={{ color:'#64748b', fontSize:13, lineHeight:1.65, flex:1 }}>{desc}</p>
                      <button style={{
                        padding:'10px 20px', background:'#0f172a', color:'#f8fafc',
                        border:'none', borderRadius:9, fontSize:13, fontWeight:700,
                        cursor:'pointer', alignSelf:'flex-start', letterSpacing:'0.02em',
                        transition:'background 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background='#1e293b'}
                        onMouseLeave={e => e.currentTarget.style.background='#0f172a'}
                      >
                        Generate Report
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
};

export default SuperAdminDashboard;