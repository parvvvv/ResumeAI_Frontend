import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineUpload, HiOutlineViewGrid, HiOutlineLogout } from 'react-icons/hi';
import Logo from './Logo';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand" style={{ textDecoration: 'none' }}>
        <Logo size={28} />
        ElevateCV
      </Link>

      <div className="navbar-actions">
        <Link to="/upload" className="btn btn-sm btn-secondary">
          <HiOutlineUpload /> <span>Upload</span>
        </Link>
        <Link to="/dashboard" className="btn btn-sm btn-secondary">
          <HiOutlineViewGrid /> <span>Dashboard</span>
        </Link>
        <div className="navbar-user">
          <span className="hide-on-mobile">{user?.email?.split('@')[0]}</span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => { logout(); navigate('/login'); }}
          >
            <HiOutlineLogout /> <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
