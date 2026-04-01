import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineUpload, HiOutlineViewGrid, HiOutlineLogout, HiOutlineSearch, HiX } from 'react-icons/hi';
import { useSearch } from '../context/SearchContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef(null);

  // Close search on route change
  useEffect(() => {
    setIsSearchActive(false);
  }, [location.pathname]);

  // Handle click outside to close search on mobile
  useEffect(() => {
    if (!isSearchActive) return;
    const handleClick = (e) => {
      // If click isn't inside nav, close it
      if (!e.target.closest('.navbar')) {
        setIsSearchActive(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isSearchActive]);

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      {!isSearchActive && (
        <Link to="/dashboard" className="navbar-brand" style={{ textDecoration: 'none' }}>
          <Logo size={28} />
          ElevateCV
        </Link>
      )}

      {/* Global Search Bar */}
      <div className={`navbar-search ${isSearchActive ? 'active' : ''}`}>
        <div className="search-input-wrapper">
          <HiOutlineSearch className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="input search-input"
            placeholder="Search resumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {(searchQuery || isSearchActive) && (
            <button className="btn-icon text-muted" onClick={() => { setSearchQuery(''); setIsSearchActive(false); }}>
              <HiX />
            </button>
          )}
        </div>
      </div>

      <div className={`navbar-actions ${isSearchActive ? 'hidden' : ''}`}>
        <button className="btn btn-sm btn-icon mobile-search-trigger" onClick={() => {
          setIsSearchActive(true);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }}>
          <HiOutlineSearch />
        </button>

        <Link to="/upload" className="btn btn-sm btn-secondary hide-on-mobile">
          <HiOutlineUpload /> <span>Upload</span>
        </Link>
        <Link to="/dashboard" className="btn btn-sm btn-secondary hide-on-mobile">
          <HiOutlineViewGrid /> <span>Dashboard</span>
        </Link>
        <div className="navbar-user">
          <span className="hide-on-mobile">{user?.email?.split('@')[0]}</span>
          <button
            className="btn btn-icon btn-secondary"
            onClick={() => { logout(); navigate('/login'); }}
            title="Logout"
          >
            <HiOutlineLogout /> <span className="hide-on-mobile">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
