import { useState, useMemo } from 'react';
import { useJobs } from '../context/JobsContext';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBriefcase, HiOutlineRefresh, HiOutlineExternalLink,
  HiOutlineLocationMarker, HiOutlineClock, HiOutlineChevronLeft,
  HiOutlineDocumentText, HiOutlineX, HiOutlineSparkles
} from 'react-icons/hi';
import { useToast } from '../context/ToastContext';

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

/* ─── Resume Selection Modal ─── */
function ResumeSelectModal({ isOpen, onClose, resumes, onSelect, jobTitle, isTailoring }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'left' }}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="modal-icon-small" style={{ margin: 0, background: 'rgba(133, 173, 255, 0.1)', color: 'var(--primary)' }}>
              <HiOutlineDocumentText />
            </div>
            <h3 className="display-sm" style={{ fontSize: '1.25rem', marginBottom: 0 }}>Select Base Resume</h3>
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClose} disabled={isTailoring}>
            <HiOutlineX size={20} />
          </button>
        </div>
        
        <p className="body-md text-muted mb-6">
          Choose a resume to tailor for <strong style={{ color: 'var(--on-surface)' }}>{jobTitle}</strong>
        </p>

        <div className="modal-resume-list custom-scrollbar">
          {resumes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted mb-4">No base resumes found.</p>
              <button className="btn btn-primary" onClick={() => onClose()}>
                Upload a Resume
              </button>
            </div>
          ) : (
            resumes.map((resume) => (
              <button
                key={resume.id}
                className="modal-resume-item"
                onClick={() => onSelect(resume.id)}
                disabled={isTailoring}
              >
                <div className="flex items-center gap-3">
                  <div className="resume-icon-circle">
                    <HiOutlineDocumentText size={20} />
                  </div>
                  <div className="text-left flex-1 truncate">
                    <div className="resume-item-title truncate">
                      {resume.resumeData?.personalInfo?.fullName || resume.resumeData?.personal?.name || 'Untitled Resume'}
                    </div>
                    <div className="resume-item-subtitle truncate">
                      {resume.resumeData?.personalInfo?.email || resume.resumeData?.personal?.email || 'No email'}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {isTailoring && (
          <div className="mt-6 flex items-center justify-center gap-3 py-3 px-4 glass-subtle rounded-xl border border-primary/20">
            <span className="status-dot status-dot-pulse" style={{ '--dot-color': '#f59e0b', width: '10px', height: '10px' }} />
            <span className="body-sm font-medium" style={{ color: 'var(--warning)' }}>Tailoring your resume...</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Job Card (Grid/List compatible) ─── */
function JobCard({ job, layout, onTailorClick, isTailoring, isTailored }) {
  const logoFallback = job.company ? job.company.charAt(0).toUpperCase() : '?';
  const cardClass = `slide-up ${layout === 'list' ? 'jobs-list-card' : 'job-card'} ${isTailoring ? 'job-card-tailoring' : ''} ${isTailored ? 'job-card-tailored' : ''}`;

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
      <div className={cardClass + ' fade-in'}>
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
        <div className="jobs-list-info-col" style={{ minWidth: 0, flex: 1 }}>
          <div className="job-card-title" title={job.title}>{job.title}</div>
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
          <div className="flex gap-2">
            <button
              className={`btn btn-sm ${isTailored ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => onTailorClick(job)}
              disabled={isTailoring || isTailored}
              title={isTailored ? "Already tailored" : "Tailor your resume for this job"}
            >
              <HiOutlineSparkles /> {isTailored ? 'Tailored' : 'Tailor'}
            </button>
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
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div className={cardClass}>
      <div className="job-card-header flex justify-between" style={{ minWidth: 0 }}>
        <div className="flex gap-3" style={{ minWidth: 0, flex: 1 }}>
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
          <div className="job-card-info" style={{ minWidth: 0, flex: 1 }}>
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

      <div className="job-card-actions">
        <button
          className={`btn btn-sm btn-tailor ${isTailored ? 'btn-success' : 'btn-secondary'}`}
          onClick={() => onTailorClick(job)}
          disabled={isTailoring || isTailored}
          title={isTailored ? "Already tailored" : "Tailor your resume for this job"}
        >
          <HiOutlineSparkles />
        </button>
        <a
          href={job.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm job-apply-btn btn-apply"
        >
          Apply Now <HiOutlineExternalLink />
        </a>
      </div>
    </div>
  );
}

export default function Jobs() {
  const { jobs, profile, status, baseResumes, tailoringStatus, fetchJobs, tailorForJob } = useJobs();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [layout, setLayout] = useState('list'); // 'grid' | 'list'
  const [visibleCount, setVisibleCount] = useState(12);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const loading = status === 'loading';
  const hasJobs = jobs.length > 0;

  // Pagination logic
  const visibleJobs = useMemo(() => {
    return jobs.slice(0, visibleCount);
  }, [jobs, visibleCount]);

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + (layout === 'grid' ? 6 : 10));
  };

  const handleTailorClick = (job) => {
    setSelectedJob(job);
    setModalOpen(true);
  };

  const handleResumeSelect = async (baseResumeId) => {
    if (!selectedJob) return;
    try {
      // Start tailoring process
      await tailorForJob(selectedJob.job_id, baseResumeId);
      
      // Close modal immediately since backend now returns 202 Accepted almost instantly
      setModalOpen(false);
      setSelectedJob(null);
      
      // Provide immediate feedback
      addToast('Tailoring process started 🚀 You\'ll see the new resume on your dashboard soon.', 'success');

      // Navigate to dashboard immediately so user can see progress (as they requested)
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);

    } catch (err) {
      console.error('Tailoring failed:', err);
      // Even on error, we should allow closing or show error in modal
      addToast('Failed to start tailoring. Please try again.', 'error');
    }
  };

  const handleModalClose = () => {
    // Allow closing the modal if not in the middle of a blocking action
    // Since tailorForJob is now very fast, we can almost always allow closing
    setModalOpen(false);
    setSelectedJob(null);
  };

  return (
    <div className="page jobs-page fade-in" style={{ paddingBottom: '140px' }}>
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
                  <JobCard
                    key={job.job_id}
                    job={job}
                    layout="grid"
                    onTailorClick={handleTailorClick}
                    isTailoring={tailoringStatus[job.job_id] === 'loading'}
                    isTailored={tailoringStatus[job.job_id] === 'success'}
                  />
                ))}
              </div>
            ) : (
              <div className="jobs-list-container glass">
                {visibleJobs.map((job) => (
                  <JobCard
                    key={job.job_id}
                    job={job}
                    layout="list"
                    onTailorClick={handleTailorClick}
                    isTailoring={tailoringStatus[job.job_id] === 'loading'}
                    isTailored={tailoringStatus[job.job_id] === 'success'}
                  />
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

      {/* Resume Selection Modal */}
      <ResumeSelectModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        resumes={baseResumes}
        onSelect={handleResumeSelect}
        jobTitle={selectedJob?.title || 'this job'}
        isTailoring={selectedJob && tailoringStatus[selectedJob.job_id] === 'loading'}
      />
    </div>
  );
}
