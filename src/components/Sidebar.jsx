import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineViewGrid, HiOutlineUpload, HiOutlineBriefcase,
  HiOutlineTag, HiOutlineShieldCheck, HiOutlineLogout,
  HiOutlineDocumentText, HiOutlineAcademicCap,
  HiChevronLeft, HiChevronRight
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { useStudyPlan } from '../context/StudyPlanContext';
import Logo from './Logo';
import StreakBadge from './study-planner/StreakBadge';
import { canAccessTemplatePlatform } from '../lib/templatePlatform';

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { status } = useJobs();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  );

  // Auto-collapse on study planner for more room
  useEffect(() => {
    if (location.pathname === '/study-planner') {
      setCollapsed(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const shell = document.querySelector('.app-shell');
    if (shell) {
      shell.classList.toggle('sidebar-collapsed', collapsed);
    }
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const canUseTemplates = canAccessTemplatePlatform(user);

  const statusColor = {
    loading: 'var(--warning)',
    found: 'var(--success)',
    empty: 'var(--warning)',
    error: 'var(--error)',
    idle: 'var(--outline)',
  }[status] || 'var(--outline)';

  const navItems = useMemo(() => {
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid /> },
      { path: '/study-planner', label: 'Study Plan', icon: <HiOutlineAcademicCap /> },
      { path: '/resumes', label: 'Resumes', icon: <HiOutlineDocumentText /> },
      { path: '/upload', label: 'Upload', icon: <HiOutlineUpload /> },
      { path: '/jobs', label: 'Jobs', icon: <HiOutlineBriefcase />, showStatus: true },
    ];
    if (canUseTemplates) {
      items.push({ path: '/templates', label: 'Templates', icon: <HiOutlineTag /> });
    }
    if (user?.role === 'admin') {
      items.push({ path: '/admin', label: 'Admin', icon: <HiOutlineShieldCheck /> });
    }
    return items;
  }, [canUseTemplates, user?.role]);

  if (!isAuthenticated) return null;

  const initial = (user?.email?.[0] || 'U').toUpperCase();
  const displayName = user?.email?.split('@')[0] || 'Account';

  return (
    <>
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <Link to="/dashboard" className="sidebar-brand">
          <Logo size={28} />
          <span>Hirecraft</span>
        </Link>

        <nav className="sidebar-nav" aria-label="Primary">
          {navItems.map((item) => {
            const active = item.path === '/templates'
              ? location.pathname.startsWith('/templates')
              : location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="sidebar-nav-icon">
                  {item.icon}
                  {item.showStatus && (
                    <span
                      className={`status-dot sidebar-status-dot ${status === 'loading' || status === 'found' ? 'status-dot-pulse' : ''}`}
                      style={{ '--dot-color': statusColor }}
                    />
                  )}
                </span>
                <span className="sidebar-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <StreakBadge />

        <div className="sidebar-footer mt-2">
          <div className="sidebar-footer-row">
            <div className="sidebar-user">
              <span className="sidebar-avatar">{initial}</span>
              <span className="sidebar-user-name" title={user?.email}>{displayName}</span>
            </div>
          </div>
          <button
            className="sidebar-logout"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <HiOutlineLogout />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <button
        className={`sidebar-collapse-btn ${collapsed ? 'collapsed' : ''}`}
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <HiChevronRight size={16} /> : <HiChevronLeft size={16} />}
      </button>
    </>
  );
}
