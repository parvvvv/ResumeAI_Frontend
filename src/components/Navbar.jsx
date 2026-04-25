import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { useResumes } from '../context/ResumeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineUpload, HiOutlineViewGrid, HiOutlineLogout, HiOutlineSearch, HiOutlineBriefcase, HiX, HiOutlineTag, HiOutlineUser, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { useSearch } from '../context/SearchContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen } = useSearch();
  const { status } = useJobs();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  
  const [isMac, setIsMac] = useState(true);

  // Get resume data for recommendations
  const { baseResumes = [], generatedResumes: genResumes = [] } = useResumes();
  const generatedResumes = genResumes;

  useEffect(() => {
    setIsMac(navigator.userAgent.toLowerCase().includes('mac'));
  }, []);

  // Handle global shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        if (window.innerWidth <= 768) {
          setIsSearchActive(true);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        } else {
          searchInputRef.current?.focus();
        }
      }
      // Escape closes the recommendation panel but keeps the query
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Close search panel on route change
  useEffect(() => {
    setIsSearchActive(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Handle click outside — close panel but KEEP the search query
  useEffect(() => {
    if (!isSearchOpen && !isSearchActive) return;
    const handleClick = (e) => {
      // If click is inside our search container (input + recommendations), do nothing
      if (searchContainerRef.current && searchContainerRef.current.contains(e.target)) {
        return;
      }
      // Click is outside — close the panel overlay, but preserve query
      setIsSearchOpen(false);
      // On mobile, also collapse the search bar if clicking outside navbar
      if (!e.target.closest('.navbar')) {
        setIsSearchActive(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isSearchOpen, isSearchActive]);

  // Build recommendation data from resumes
  const recommendations = useMemo(() => {
    const keywordsSet = new Set();
    const creatorsSet = new Set();
    const rolesSet = new Set();
    const companiesSet = new Set();

    baseResumes.forEach(r => {
      const name = r.resumeData?.personalInfo?.fullName;
      if (name) creatorsSet.add(name);

      const workExp = r.resumeData?.workExperience || [];
      workExp.forEach(exp => {
        if (exp.role) rolesSet.add(exp.role);
        if (exp.company) companiesSet.add(exp.company);
      });

      const skills = r.resumeData?.skills || [];
      if (Array.isArray(skills)) {
        skills.forEach(cat => {
          if (Array.isArray(cat.items)) {
            cat.items.forEach(skill => keywordsSet.add(skill));
          }
        });
      }
    });

    generatedResumes.forEach(r => {
      if (r.analytics?.matchedKeywords) {
        r.analytics.matchedKeywords.forEach(kw => keywordsSet.add(kw));
      }
    });

    return {
      keywords: [...keywordsSet].slice(0, 8),
      creators: [...creatorsSet].slice(0, 5),
      roles: [...rolesSet].slice(0, 6),
      companies: [...companiesSet].slice(0, 6),
    };
  }, [baseResumes, generatedResumes]);

  // Filter recommendations based on current query
  const filteredRecs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return recommendations;

    return {
      keywords: recommendations.keywords.filter(k => k.toLowerCase().includes(q)),
      creators: recommendations.creators.filter(c => c.toLowerCase().includes(q)),
      roles: recommendations.roles.filter(r => r.toLowerCase().includes(q)),
      companies: recommendations.companies.filter(c => c.toLowerCase().includes(q)),
    };
  }, [searchQuery, recommendations]);

  const hasRecommendations = filteredRecs.keywords.length > 0 || filteredRecs.creators.length > 0 || filteredRecs.roles.length > 0 || filteredRecs.companies.length > 0;

  const handleRecommendationClick = (value) => {
    setSearchQuery(value);
    // Close the recommendations panel after selecting, keep the query active
    setIsSearchOpen(false);
  };

  // Clear everything — only used by the explicit X button
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
    setIsSearchActive(false);
  };

  if (!isAuthenticated) return null;

  const colors = {
    loading: '#f59e0b',
    found: '#10b981',
    empty: '#f59e0b',
    error: '#ff716c',
    idle: '#74757d',
  };
  const statusColor = colors[status] || colors.idle;

  return (
    <>
      {/* Blur Overlay when search panel is open — clicking it just closes the panel */}
      {isSearchOpen && (
        <div 
          className="search-blur-overlay" 
          onClick={() => setIsSearchOpen(false)}
        />
      )}

      {/* Top Navbar */}
      <nav className={`navbar ${isSearchOpen ? 'navbar-search-elevated' : ''}`}>
        {!isSearchActive && (
          <Link to="/dashboard" className="navbar-brand" style={{ textDecoration: 'none' }}>
            <Logo size={28} />
            Hirecraft
          </Link>
        )}

        {/* Global Search Bar */}
        <div className={`navbar-search ${isSearchActive ? 'active' : ''}`} ref={searchContainerRef}>
          <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <HiOutlineSearch className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="input search-input"
              placeholder="Search resumes..."
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {!searchQuery && !isSearchActive && !isSearchOpen && (
              <div 
                className="search-shortcut text-muted hide-on-mobile" 
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  fontSize: '0.75rem', 
                  pointerEvents: 'none', 
                  background: 'var(--surface-container-high)', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  border: '1px solid var(--outline-variant)',
                  fontWeight: 600,
                  letterSpacing: '0.5px'
                }}
              >
                {isMac ? '⌘K' : 'Ctrl+K'}
              </div>
            )}
            {(searchQuery || isSearchActive) && (
              <button 
                className="btn-icon text-muted" 
                style={{ position: 'absolute', right: '4px' }} 
                onClick={handleClearSearch}
              >
                <HiX />
              </button>
            )}
          </div>

          {/* Search Recommendations Panel */}
          {isSearchOpen && hasRecommendations && (
            <div className="search-recommendations-panel">
              <div className="search-recs-header">
                <HiOutlineSearch style={{ opacity: 0.5 }} />
                <span>{searchQuery ? 'Results' : 'Quick Search'}</span>
                <span className="search-recs-hint">ESC to close</span>
              </div>

              {filteredRecs.creators.length > 0 && (
                <div className="search-recs-section">
                  <div className="search-recs-label">
                    <HiOutlineUser /> Creator
                  </div>
                  <div className="search-recs-chips">
                    {filteredRecs.creators.map((c, i) => (
                      <button key={i} className="search-rec-chip creator" onClick={() => handleRecommendationClick(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredRecs.roles.length > 0 && (
                <div className="search-recs-section">
                  <div className="search-recs-label">
                    <HiOutlineBriefcase /> Role
                  </div>
                  <div className="search-recs-chips">
                    {filteredRecs.roles.map((r, i) => (
                      <button key={i} className="search-rec-chip role" onClick={() => handleRecommendationClick(r)}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredRecs.companies.length > 0 && (
                <div className="search-recs-section">
                  <div className="search-recs-label">
                    <HiOutlineOfficeBuilding /> Company
                  </div>
                  <div className="search-recs-chips">
                    {filteredRecs.companies.map((c, i) => (
                      <button key={i} className="search-rec-chip company" onClick={() => handleRecommendationClick(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredRecs.keywords.length > 0 && (
                <div className="search-recs-section">
                  <div className="search-recs-label">
                    <HiOutlineTag /> Keywords
                  </div>
                  <div className="search-recs-chips">
                    {filteredRecs.keywords.map((kw, i) => (
                      <button key={i} className="search-rec-chip keyword" onClick={() => handleRecommendationClick(kw)}>
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`navbar-actions ${isSearchActive ? 'hidden' : ''}`}>
          <button className="btn btn-sm btn-icon btn-secondary mobile-search-trigger" onClick={() => {
            setIsSearchActive(true);
            setIsSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }}>
            <HiOutlineSearch />
          </button>

          <Link to="/jobs" style={{ position: 'relative' }} className={`btn btn-sm btn-secondary hide-on-mobile nav-jobs-btn ${location.pathname === '/jobs' ? 'active' : ''}`}>
            <span 
              className={`status-dot nav-status-dot ${status === 'loading' || status === 'found' ? 'status-dot-pulse' : ''}`} 
              style={{ '--dot-color': statusColor, top: '-4px', left: '-4px' }} 
            />
            <div className="nav-icon-wrapper">
              <HiOutlineBriefcase />
            </div>
            <span>Jobs</span>
          </Link>
          <Link to="/upload" className={`btn btn-sm btn-secondary hide-on-mobile ${location.pathname === '/upload' ? 'active' : ''}`}>
            <HiOutlineUpload /> <span>Upload</span>
          </Link>
          <Link to="/dashboard" className={`btn btn-sm btn-secondary hide-on-mobile ${location.pathname === '/dashboard' ? 'active' : ''}`}>
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

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <Link to="/dashboard" className={`mobile-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
          <HiOutlineViewGrid />
        </Link>
        <div className="mobile-nav-divider"></div>
        <Link to="/upload" className={`mobile-nav-item mobile-nav-upload ${location.pathname === '/upload' ? 'active' : ''}`}>
          <HiOutlineUpload />
        </Link>
        <div className="mobile-nav-divider"></div>
        <Link to="/jobs" style={{ position: 'relative' }} className={`mobile-nav-item ${location.pathname === '/jobs' ? 'active' : ''}`}>
          <span 
            className={`status-dot nav-status-dot ${status === 'loading' || status === 'found' ? 'status-dot-pulse' : ''}`} 
            style={{ '--dot-color': statusColor, top: '4px', left: '10px' }} 
          />
          <div className="nav-icon-wrapper">
            <HiOutlineBriefcase />
          </div>
        </Link>
      </div>
    </>
  );
}
