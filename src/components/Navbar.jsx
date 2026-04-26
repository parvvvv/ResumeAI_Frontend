import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobsContext';
import { useResumes } from '../context/ResumeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineUpload, HiOutlineViewGrid, HiOutlineLogout, HiOutlineSearch, HiOutlineBriefcase, HiX, HiOutlineTag, HiOutlineUser, HiOutlineOfficeBuilding, HiOutlineShieldCheck } from 'react-icons/hi';
import { useSearch } from '../context/SearchContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen } = useSearch();
  const { status } = useJobs();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isNavDragging, setIsNavDragging] = useState(false);
  const [navIndicatorStyle, setNavIndicatorStyle] = useState(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const mobileNavRef = useRef(null);
  const navDragRef = useRef(null);
  const mobileItemRefs = useRef([]);
  const suppressClickRef = useRef(false);
  
  const [isMac] = useState(() => (
    typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac')
  ));

  // Get resume data for recommendations
  const { baseResumes = [], generatedResumes: genResumes = [] } = useResumes();
  const generatedResumes = genResumes;

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
  }, [isSearchOpen, setIsSearchOpen]);

  // Close search panel on route change
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsSearchActive(false);
      setIsSearchOpen(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, setIsSearchOpen]);

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
  }, [isSearchOpen, isSearchActive, setIsSearchOpen]);

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

  const colors = {
    loading: '#f59e0b',
    found: '#10b981',
    empty: '#f59e0b',
    error: '#ff716c',
    idle: '#74757d',
  };
  const statusColor = colors[status] || colors.idle;

  const mobileNavItems = useMemo(() => {
    const items = [
      { path: '/dashboard', label: 'Home', icon: <HiOutlineViewGrid /> },
      { path: '/upload', label: 'Upload resume', icon: <HiOutlineUpload />, className: 'mobile-nav-upload' },
      {
        path: '/jobs',
        label: 'Recommended jobs',
        icon: (
          <>
            <span
              className={`status-dot nav-status-dot ${status === 'loading' || status === 'found' ? 'status-dot-pulse' : ''}`}
              style={{ '--dot-color': statusColor, top: '4px', left: '10px' }}
            />
            <div className="nav-icon-wrapper">
              <HiOutlineBriefcase />
            </div>
          </>
        ),
      },
    ];

    if (user?.role === 'admin') {
      items.push({ path: '/admin', label: 'Admin', icon: <HiOutlineShieldCheck /> });
    }

    return items;
  }, [status, statusColor, user?.role]);

  const activeNavIndex = mobileNavItems.findIndex((item) => item.path === location.pathname);

  useEffect(() => {
    const syncIndicatorToIndex = (index) => {
      const navElement = mobileNavRef.current;
      const itemElement = mobileItemRefs.current[index];
      if (!navElement || !itemElement) return;

      const navRect = navElement.getBoundingClientRect();
      const itemRect = itemElement.getBoundingClientRect();
      setNavIndicatorStyle({
        width: itemRect.width,
        height: itemRect.height,
        x: itemRect.left - navRect.left,
        y: itemRect.top - navRect.top,
      });
    };

    syncIndicatorToIndex(activeNavIndex === -1 ? 0 : activeNavIndex);
    const handleResize = () => syncIndicatorToIndex(activeNavIndex === -1 ? 0 : activeNavIndex);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeNavIndex, mobileNavItems.length]);

  const moveIndicatorToItem = (index) => {
    const navElement = mobileNavRef.current;
    const itemElement = mobileItemRefs.current[index];
    if (!navElement || !itemElement) return;

    const navRect = navElement.getBoundingClientRect();
    const itemRect = itemElement.getBoundingClientRect();
    setNavIndicatorStyle({
      width: itemRect.width,
      height: itemRect.height,
      x: itemRect.left - navRect.left,
      y: itemRect.top - navRect.top,
    });
  };

  const getClosestNavIndex = (clientX) => {
    const distances = mobileItemRefs.current.map((element, index) => {
      if (!element) return { index, distance: Number.POSITIVE_INFINITY };
      const rect = element.getBoundingClientRect();
      return { index, distance: Math.abs(clientX - (rect.left + rect.width / 2)) };
    });

    distances.sort((left, right) => left.distance - right.distance);
    return distances[0]?.index ?? activeNavIndex;
  };

  const resetMobileNavDrag = () => {
    navDragRef.current = null;
    setIsNavDragging(false);
  };

  const handleMobileNavPointerDown = (event) => {
    if (event.pointerType === 'mouse') return;
    const activeElement = mobileItemRefs.current[activeNavIndex];
    if (!activeElement || !activeElement.contains(event.target)) return;

    navDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      previewIndex: activeNavIndex,
    };
    setIsNavDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleMobileNavPointerMove = (event) => {
    if (!navDragRef.current) return;
    const dx = event.clientX - navDragRef.current.startX;
    const dy = event.clientY - navDragRef.current.startY;

    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 14) {
      moveIndicatorToItem(activeNavIndex);
      resetMobileNavDrag();
      return;
    }

    if (Math.abs(dx) < 6) return;

    const previewIndex = getClosestNavIndex(event.clientX);
    navDragRef.current.previewIndex = previewIndex;
    moveIndicatorToItem(previewIndex);
    suppressClickRef.current = true;
  };

  const handleMobileNavPointerUp = () => {
    if (!navDragRef.current) return;
    const previewIndex = navDragRef.current.previewIndex;
    const nextItem = mobileNavItems[previewIndex];
    const currentIndex = activeNavIndex === -1 ? 0 : activeNavIndex;

    if (nextItem && previewIndex !== currentIndex) {
      navigate(nextItem.path, { state: { navDirection: previewIndex > currentIndex ? 1 : -1 } });
    } else {
      moveIndicatorToItem(currentIndex);
    }

    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 220);
    resetMobileNavDrag();
  };

  const handleMobileNavClickCapture = (event) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  if (!isAuthenticated) return null;

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
          }} aria-label="Open search">
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
            <HiOutlineViewGrid /> <span>Home</span>
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={`btn btn-sm btn-secondary hide-on-mobile ${location.pathname === '/admin' ? 'active' : ''}`}>
              <HiOutlineShieldCheck /> <span>Admin</span>
            </Link>
          )}
          <div className="navbar-user">
            <span className="hide-on-mobile">{user?.email?.split('@')[0]}</span>
            <button
              className="btn btn-icon btn-secondary"
              onClick={() => { logout(); navigate('/login'); }}
              title="Logout"
              aria-label="Logout"
            >
              <HiOutlineLogout /> <span className="hide-on-mobile">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div
        ref={mobileNavRef}
        className={`mobile-bottom-nav ${isNavDragging ? 'is-dragging' : ''}`}
        onPointerDown={handleMobileNavPointerDown}
        onPointerMove={handleMobileNavPointerMove}
        onPointerUp={handleMobileNavPointerUp}
        onPointerCancel={resetMobileNavDrag}
        onClickCapture={handleMobileNavClickCapture}
      >
        {navIndicatorStyle && (
          <span
            className="mobile-nav-indicator"
            style={{
              width: `${navIndicatorStyle.width}px`,
              height: `${navIndicatorStyle.height}px`,
              transform: `translate3d(${navIndicatorStyle.x}px, ${navIndicatorStyle.y}px, 0)`,
            }}
          />
        )}
        {mobileNavItems.map((item, index) => (
          <Link
            key={item.path}
            ref={(element) => {
              mobileItemRefs.current[index] = element;
            }}
            to={item.path}
            state={{
              navDirection: index > (activeNavIndex === -1 ? 0 : activeNavIndex) ? 1 : -1,
            }}
            style={{ position: item.path === '/jobs' ? 'relative' : undefined }}
            className={`mobile-nav-item ${item.className || ''} ${location.pathname === item.path ? 'active' : ''}`}
            aria-label={item.label}
            aria-current={location.pathname === item.path ? 'page' : undefined}
          >
            {item.icon}
          </Link>
        ))}
      </div>
    </>
  );
}
