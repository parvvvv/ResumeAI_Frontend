import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineViewGrid, HiOutlineUpload, HiOutlineBriefcase,
  HiOutlineTag, HiOutlineShieldCheck, HiOutlineLogout,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { canAccessTemplatePlatform } from '../lib/templatePlatform';

export default function Sidebar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { status } = useJobs();
  const location = useLocation();
  const navigate = useNavigate();

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
    <aside className="app-sidebar">
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

      <div className="sidebar-footer">
        <div className="sidebar-footer-row">
          <div className="sidebar-user">
            <span className="sidebar-avatar">{initial}</span>
            <span className="sidebar-user-name" title={user?.email}>{displayName}</span>
          </div>
          <ThemeToggle />
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
  );
}
