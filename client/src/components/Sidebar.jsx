import { NavLink, useNavigate } from 'react-router-dom';
import { Mic, LayoutDashboard, History, Upload } from 'lucide-react';

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
        </div>
        <span className="sidebar-logo-text">Vox<span>AI</span></span>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Workspace</span>

        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>

        <NavLink to="/upload" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Upload size={16} />
          Upload &amp; Record
        </NavLink>

        <NavLink to="/history" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <History size={16} />
          History
        </NavLink>

        <span className="nav-section-label" style={{ marginTop: 16 }}>Quick Actions</span>

        <button className="nav-item" onClick={() => navigate('/upload?tab=record')}>
          <Mic size={16} />
          New Recording
        </button>

        <button className="nav-item" onClick={() => navigate('/upload?tab=upload')}>
          <Upload size={16} />
          Upload File
        </button>
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <span style={{ color: 'var(--accent-dim)', fontWeight: 600 }}>VoxAI</span> v1.0<br />
          Powered by Whisper
        </div>
      </div>
    </aside>
  );
}
