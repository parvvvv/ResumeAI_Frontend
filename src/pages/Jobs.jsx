import { useState, useMemo } from 'react';
import { useJobs } from '../context/JobsContext';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBriefcase, HiOutlineRefresh, HiOutlineExternalLink,
  HiOutlineLocationMarker, HiOutlineClock, HiOutlineChevronLeft
} from 'react-icons/hi';

/* ─── Skeleton Loader ─── */
function JobSkeleton() {
  return (
    <div className="job-card job-skeleton">
      <div className="job-card-header">
        <div className="skeleton-circle" />
        <div className="skeleton-lines">
          <div className="skeleton-line w-70" />
          <div className="skeleton-line w-50" />
        </div>
      </div>
      <div className="skeleton-line w-40 mt-2" />
      <div className="skeleton-line w-90 mt-2" />
    </div>
  );
}

/* ─── Profile Badge ─── */
function ProfileBadge({ profile }) {
  const labels = {
    'fresher-tech': { text: 'Fresher Tech', color: 'var(--primary)' },
    'experienced-tech': { text: 'Experienced Tech', color: 'var(--success)' },
    'non-tech': { text: 'Non-Tech', color: 'var(--tertiary)' },
  };
  const info = labels[profile] || labels['fresher-tech'];
  return (
    <span className="badge" style={{ background: `${info.color}20`, color: info.color }}>
      {info.text}
    </span>
  );
}

/* ─── Job Card (Grid/List compatible) ─── */
function JobCard({ job, layout }) {
  const logoFallback = job.company ? job.company.charAt(0).toUpperCase() : '?';

  const getTimeAgo = () => {
    if (!job.posted_at) return job.posted_at_label || '';
    const posted = new Date(job.posted_at);
    const now = new Date();
    const diffHrs = Math.floor((now - posted) / (1000 * 60 * 60));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs === 1) return '1 hr ago';
    if (diffHrs < 24) return `${diffHrs} hrs ago`;
    const days = Math.floor(diffHrs / 24);
    return `${days}d ago`;
  };

  if (layout === 'list') {
    return (
      <div className="jobs-list-card fade-in">
        <div className="jobs-list-logo-col">
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt={job.company}
              className="job-card-logo"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div className="job-card-logo-fallback" style={{ display: job.company_logo ? 'none' : 'flex' }}>
            {logoFallback}
          </div>
        </div>
        <div className="jobs-list-info-col">
          <div className="job-card-title">{job.title}</div>
          <div className="job-card-company">{job.company}</div>
          <div className="job-card-meta mt-1">
            {job.location && (
              <span className="job-meta-item">
                <HiOutlineLocationMarker /> {job.location}
              </span>
            )}
            {job.employment_type && (
              <span className="job-meta-item">
                <span className="job-row-dot">•</span> {job.employment_type}
              </span>
            )}
            {job.is_remote && (
              <span className="job-meta-item" style={{ color: 'var(--success)' }}>
                <span className="job-row-dot">•</span> Remote
              </span>
            )}
          </div>
        </div>
        <div className="jobs-list-action-col">
          <div className="job-meta-item job-posted-badge mb-2 justify-end">
            <HiOutlineClock /> {getTimeAgo()}
          </div>
          <a
            href={job.apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm job-apply-btn"
          >
            Apply <HiOutlineExternalLink className="hide-on-mobile" />
          </a>
        </div>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div className="job-card slide-up">
      <div className="job-card-header flex justify-between">
        <div className="flex gap-3">
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt={job.company}
              className="job-card-logo"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div className="job-card-logo-fallback" style={{ display: job.company_logo ? 'none' : 'flex' }}>
            {logoFallback}
          </div>
          <div className="job-card-info">
            <div className="job-card-title" title={job.title}>{job.title}</div>
            <div className="job-card-company">{job.company}</div>
          </div>
        </div>
      </div>

      <div className="job-card-meta mt-3">
        {job.location && (
          <span className="job-meta-item">
            <HiOutlineLocationMarker /> {job.location}
          </span>
        )}
        {getTimeAgo() && (
          <span className="job-meta-item job-posted-badge">
            <HiOutlineClock /> {getTimeAgo()}
          </span>
        )}
      </div>

      <div className="job-card-tags">
        {job.employment_type && (
          <span className="job-type-chip">{job.employment_type}</span>
        )}
        {job.is_remote && <span className="job-type-chip job-chip-remote">Remote</span>}
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(70, 72, 79, 0.1)', marginTop: 'auto' }}>
        <a
          href={job.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm job-apply-btn w-full justify-center"
        >
          Apply Now <HiOutlineExternalLink />
        </a>
      </div>
    </div>
  );
}

export default function Jobs() {
  const { jobs, profile, status, fetchJobs } = useJobs();
  const navigate = useNavigate();
  const [layout, setLayout] = useState('list'); // 'grid' | 'list'
  const [visibleCount, setVisibleCount] = useState(12);

  const loading = status === 'loading';
  const hasJobs = jobs.length > 0;

  // Pagination logic
  const visibleJobs = useMemo(() => {
    return jobs.slice(0, visibleCount);
  }, [jobs, visibleCount]);

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + (layout === 'grid' ? 6 : 10));
  };

  return (
    <div className="page jobs-page fade-in pb-24">
      {/* Header section */}
      <div className="jobs-header glass ambient-glow">
        <button className="btn btn-icon btn-secondary mb-4" onClick={() => navigate('/dashboard')}>
          <HiOutlineChevronLeft /> Back to Dashboard
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="display-md flex items-center gap-3">
              <HiOutlineBriefcase className="text-primary" />
              Recommended Jobs
              {status === 'loading' && <span className="status-dot status-dot-pulse" style={{ '--dot-color': '#f59e0b' }} />}
              {status === 'found' && <span className="status-dot" style={{ '--dot-color': '#10b981' }} />}
            </h1>
            <p className="body-lg mt-2 text-muted">
              Auto-tailored to your generated resume summaries.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {profile && <ProfileBadge profile={profile} />}
            <button 
              className="btn btn-secondary flex items-center gap-2" 
              onClick={fetchJobs}
              disabled={loading}
            >
              <HiOutlineRefresh className={loading ? 'spin-icon' : ''} />
              <span className="hide-on-mobile">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-8">
        {loading && jobs.length === 0 ? (
          <div className="jobs-grid">
            {[...Array(6)].map((_, i) => <JobSkeleton key={i} />)}
          </div>
        ) : !hasJobs ? (
          <div className="card card-elevated text-center py-16">
            <div className="mb-4 text-primary opacity-60 flex justify-center">
              <HiOutlineBriefcase size={64} />
            </div>
            <h2 className="display-sm mb-4">No recommendations yet</h2>
            <p className="body-lg mb-6 text-muted max-w-md mx-auto">
              We need to auto-analyze your tailored resumes to find the perfect matches. Generate a resume to get started!
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-muted text-sm">
                Showing {visibleJobs.length} of {jobs.length} roles found
              </div>
              
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${layout === 'grid' ? 'active' : ''}`}
                  onClick={() => setLayout('grid')}
                  title="Grid View"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </button>
                <button
                  className={`view-toggle-btn ${layout === 'list' ? 'active' : ''}`}
                  onClick={() => setLayout('list')}
                  title="List View"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Jobs List/Grid */}
            {layout === 'grid' ? (
              <div className="jobs-grid">
                {visibleJobs.map((job) => (
                  <JobCard key={job.job_id} job={job} layout="grid" />
                ))}
              </div>
            ) : (
              <div className="jobs-list-container glass">
                {visibleJobs.map((job) => (
                  <JobCard key={job.job_id} job={job} layout="list" />
                ))}
              </div>
            )}

            {/* Pagination / Show More */}
            {visibleCount < jobs.length && (
              <div className="mt-8 flex justify-center">
                <button 
                  className="btn btn-secondary glass ambient-glow px-8" 
                  onClick={handleShowMore}
                >
                  Load More Roles
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
