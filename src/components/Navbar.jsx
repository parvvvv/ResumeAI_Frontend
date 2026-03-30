import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineUpload, HiOutlineViewGrid, HiOutlineLogout } from 'react-icons/hi';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand" style={{ textDecoration: 'none' }}>
        <span className="logo-dot" />
        ResumeAI
      </Link>

      <div className="navbar-actions">
        <Link to="/upload" className="btn btn-sm btn-secondary">
          <HiOutlineUpload /> Upload
        </Link>
        <Link to="/dashboard" className="btn btn-sm btn-secondary">
          <HiOutlineViewGrid /> Dashboard
        </Link>
        <div className="navbar-user">
          <span>{user?.email?.split('@')[0]}</span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <HiOutlineLogout /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
