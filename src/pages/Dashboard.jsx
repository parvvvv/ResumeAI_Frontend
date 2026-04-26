import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineUpload, HiOutlinePencilAlt, HiOutlineSparkles,
  HiOutlineDocumentText, HiOutlineDownload, HiOutlineEye,
  HiOutlineDocumentAdd, HiOutlineTrash, HiDotsVertical,
  HiOutlineChevronDown, HiOutlineChevronUp,
  HiOutlineShieldCheck, HiOutlineSwitchHorizontal,
  HiOutlineLightningBolt, HiOutlineTag,
  HiOutlineArrowLeft, HiOutlineArrowRight
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useResumes } from '../context/ResumeContext';
import { useSearch } from '../context/SearchContext';
import { useNotificationEvents } from '../context/NotificationContext';
import { EmptyState, MetricStrip, PageShell, SectionHeader } from '../components/ui';

const MotionDiv = motion.div;

/* ─── Score Ring Component ─── */
function ScoreRing({ score, size = 28, strokeWidth = 2.5, showValue = true }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)';

  return (
    <div className="score-ring-inline" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-bg" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="ring-fg"
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showValue && <span className="ring-value">{score > 0 ? score : ''}</span>}
    </div>
  );
}

/* ─── Processing Card ─── */
function ProcessingCard({ baseResumeId, job, baseResumes }) {
  const baseName = baseResumes.find(b => b.id === baseResumeId)?.resumeData?.personalInfo?.fullName || 'Resume';
  const { percent, stage, message } = job;
  const totalSteps = 5;

  const getStageIcon = () => {
    switch (stage) {
      case 0: return <HiOutlineDocumentText className="pulse-icon" />;
      case 1: return <HiOutlineSparkles className="pulse-icon" />;
      case 2: return <HiOutlineLightningBolt className="pulse-icon" />;
      case 3: return <HiOutlinePencilAlt className="pulse-icon" />;
      case 4: return <HiOutlineShieldCheck className="pulse-icon" />;
      case 5: return <HiOutlineDocumentAdd className="pulse-icon" />;
      default: return <HiOutlineSparkles className="pulse-icon" />;
    }
  };

  return (
    <div className="processing-card glass slide-up flex flex-col gap-4">
      {/* Header */}
      <div className="processing-card-header flex justify-between items-center">
        <div>
          <div className="title-md flex items-center gap-2 mb-1">
            <div className="icon-badge primary">{getStageIcon()}</div>
            Tailoring in Progress
          </div>
          <div className="processing-stage-label">↳ {baseName}</div>
        </div>
        <span className="badge badge-primary">
          {stage ? `Step ${stage} of ${totalSteps}` : 'Warming up...'}
        </span>
      </div>

      {/* Highlighted Message Box */}
      {message && (
        <div className="processing-message-box">{message}</div>
      )}

      {/* Progress bar */}
      <div className="mt-2">
        <div className="processing-bar-track processing-bar-height">
          <div className="processing-bar-fill" style={{ width: `${percent}%` }}>
            <div className="processing-bar-shimmer" />
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <span className="processing-percent">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Analytics Strip (compact) ─── */
function AnalyticsStrip({ analytics }) {
  const [expanded, setExpanded] = useState(false);

  if (!analytics || !analytics.atsScore) {
    return (
      <div className="analytics-strip">
        <div className="analytics-chip" style={{ opacity: 0.5 }}>
          <HiOutlineShieldCheck style={{ fontSize: '0.9rem' }} />
          <span>ATS <span className="chip-value" style={{ color: 'var(--outline)' }}>N/A</span></span>
        </div>
      </div>
    );
  }

  const scoreColor = analytics.atsScore >= 75 ? 'var(--success)' : analytics.atsScore >= 50 ? 'var(--warning)' : 'var(--error)';
  const simColor = analytics.similarityToOriginal >= 60 ? 'var(--primary)' : 'var(--warning)';

  return (
    <div>
      <div className="analytics-strip">
        <div className="analytics-chip">
          <ScoreRing score={analytics.atsScore} />
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HiOutlineShieldCheck style={{ color: scoreColor, fontSize: '0.85rem' }} />
            <span className="chip-value" style={{ color: scoreColor }}>{analytics.atsScore}%</span>
          </span>
        </div>
        <div className="analytics-chip">
          <HiOutlineSwitchHorizontal style={{ color: simColor, fontSize: '0.85rem' }} />
          <span className="chip-value" style={{ color: simColor }}>{analytics.similarityToOriginal}%</span>
        </div>
        {analytics.matchedKeywords?.length > 0 && (
          <div className="analytics-chip">
            <HiOutlineTag style={{ color: 'var(--tertiary)', fontSize: '0.85rem' }} />
            <span className="chip-value">{analytics.matchedKeywords.length}</span>
          </div>
        )}
        <button
          className="analytics-expand-toggle"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded ? <><HiOutlineChevronUp /> Less</> : <><HiOutlineChevronDown /> More</>}
        </button>
      </div>

      {expanded && (
        <div className="analytics-detail slide-up">
          {analytics.keyChanges?.length > 0 && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div className="label-md mb-2" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HiOutlineLightningBolt style={{ color: 'var(--warning)' }} /> Key Changes
              </div>
              <ul className="change-list">
                {analytics.keyChanges.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {analytics.matchedKeywords?.length > 0 && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div className="label-md mb-2" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HiOutlineTag style={{ color: 'var(--success)' }} /> Matched Keywords
              </div>
              <div className="keyword-list">
                {analytics.matchedKeywords.map((kw, i) => (
                  <span key={i} className="keyword-tag">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {analytics.missingKeywords?.length > 0 && (
            <div>
              <div className="label-md mb-2" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HiOutlineTag style={{ color: 'var(--error)' }} /> Missing Keywords
              </div>
              <div className="keyword-list">
                {analytics.missingKeywords.map((kw, i) => (
                  <span key={i} className="keyword-tag missing">{kw}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Overflow Menu ─── */
function OverflowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="overflow-menu" ref={menuRef}>
      <button
        className="overflow-menu-trigger"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        aria-label="More options"
      >
        <HiDotsVertical />
      </button>
      {open && (
        <div className="overflow-menu-dropdown">
          {items.map((item, i) => (
            <button
              key={i}
              className={`overflow-menu-item ${item.danger ? 'overflow-menu-item-danger' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
              disabled={item.disabled}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Confirm Modal ─── */
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Delete', isLoading = false }) {
  // Close on Escape key — hook must be called before any early return
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">
          <HiOutlineTrash />
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel} disabled={isLoading}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const { 
    baseResumes, 
    generatedResumes: generated, 
    loading: contextLoading, 
    hasInitialFetch,
    deleteBase,
    deleteGenerated 
  } = useResumes();
  const { processingJobs } = useNotificationEvents();
  
  const [deleting, setDeleting] = useState(null);
  const [selectedBaseId, setSelectedBaseId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [baseLimit, setBaseLimit] = useState(4);
  const [deckIndex, setDeckIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(0);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { searchQuery, setSearchQuery } = useSearch();

  // Show full-page overlay ONLY on the very first cold load
  const loading = contextLoading && (!hasInitialFetch || (baseResumes.length === 0 && generated.length === 0));

  // ── Delete Handlers ──
  const closeModal = () => setConfirmModal({ open: false, title: '', message: '', onConfirm: null });

  const handleDeleteBase = (id) => {
    setConfirmModal({
      open: true,
      title: 'Delete Original Resume',
      message: 'Are you sure? This will delete the original resume. Any tailored versions will remain, but their connection to this original will be lost. This action cannot be undone.',
      onConfirm: async () => {
        setDeleting(id);
        try {
          await deleteBase(id);
          if (selectedBaseId === id) setSelectedBaseId(null);
          addToast('Original resume deleted.', 'success');
        } catch (err) {
          console.error('Failed to delete resume:', err);
          addToast('Failed to delete resume.', 'error');
        } finally {
          setDeleting(null);
          closeModal();
        }
      },
    });
  };

  const handleDeleteGenerated = (id) => {
    setConfirmModal({
      open: true,
      title: 'Delete Tailored Resume',
      message: 'Are you sure you want to delete this tailored resume? This action cannot be undone.',
      onConfirm: async () => {
        setDeleting(id);
        try {
          await deleteGenerated(id);
          addToast('Tailored resume deleted.', 'success');
        } catch (err) {
          console.error('Failed to delete resume:', err);
          addToast('Failed to delete resume.', 'error');
        } finally {
          setDeleting(null);
          closeModal();
        }
      },
    });
  };

  // ── Apply filters before any early returns ──
  const filteredGenerated = generated.filter((r) => {
    if (selectedBaseId && r.baseResumeId !== selectedBaseId) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const baseResume = baseResumes.find(b => b.id === r.baseResumeId);
      const baseName = baseResume?.resumeData?.personalInfo?.fullName || '';
      
      // Search in summary
      if (r.summary && r.summary.toLowerCase().includes(query)) return true;
      // Search in creator name
      if (baseName && baseName.toLowerCase().includes(query)) return true;
      
      // Search in work experience roles & companies (from base resume)
      const workExp = baseResume?.resumeData?.workExperience || [];
      for (const exp of workExp) {
        if (exp.role && exp.role.toLowerCase().includes(query)) return true;
        if (exp.company && exp.company.toLowerCase().includes(query)) return true;
      }

      // Search in skills
      const skills = baseResume?.resumeData?.skills || [];
      if (Array.isArray(skills)) {
        for (const cat of skills) {
          if (Array.isArray(cat.items)) {
            for (const skill of cat.items) {
              if (skill.toLowerCase().includes(query)) return true;
            }
          }
        }
      }

      // Search in matched keywords from analytics
      if (r.analytics?.matchedKeywords) {
        for (const kw of r.analytics.matchedKeywords) {
          if (kw.toLowerCase().includes(query)) return true;
        }
      }
      
      return false;
    }
    return true;
  });

  const chunks = [];
  for (let i = 0; i < filteredGenerated.length; i += 4) {
    chunks.push(filteredGenerated.slice(i, i + 4));
  }

  useEffect(() => {
    if (deckIndex >= chunks.length && chunks.length > 0) {
      setDeckIndex(chunks.length - 1);
    } else if (chunks.length === 0) {
      setDeckIndex(0);
    }
  }, [chunks.length, deckIndex]);

  useEffect(() => {
    setDeckIndex(0);
    setSwipeDirection(0);
  }, [selectedBaseId, searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (chunks.length <= 1) return;
      if (e.key === 'ArrowRight' && deckIndex < chunks.length - 1) {
        setSwipeDirection(1);
        setDeckIndex(prev => prev + 1);
      }
      if (e.key === 'ArrowLeft' && deckIndex > 0) {
        setSwipeDirection(-1);
        setDeckIndex(prev => prev - 1);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deckIndex, chunks.length]);

  const paginate = (newDirection) => {
    if (newDirection === 1 && deckIndex < chunks.length - 1) {
      setSwipeDirection(1);
      setDeckIndex(deckIndex + 1);
    } else if (newDirection === -1 && deckIndex > 0) {
      setSwipeDirection(-1);
      setDeckIndex(deckIndex - 1);
    }
  };

  if (loading) {
    return <div className="loading-overlay"><div className="loading-pulse" /><p>Loading your workspace...</p></div>;
  }

  const hasContent = baseResumes.length > 0 || generated.length > 0;

  // ── Compute aggregate stats ──
  const validScores = generated.filter(r => r.analytics && r.analytics.atsScore > 0);
  const avgAts = validScores.length > 0
    ? Math.round(validScores.reduce((sum, r) => sum + r.analytics.atsScore, 0) / validScores.length)
    : null;

  // ── Apply filters ──
  const filteredBase = baseResumes.filter((r) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = r.resumeData?.personalInfo?.fullName || '';
      if (name.toLowerCase().includes(query)) return true;
      
      // Search in roles and companies
      const workExp = r.resumeData?.workExperience || [];
      for (const exp of workExp) {
        if (exp.role && exp.role.toLowerCase().includes(query)) return true;
        if (exp.company && exp.company.toLowerCase().includes(query)) return true;
      }

      // Search in skills
      const skills = r.resumeData?.skills || [];
      if (Array.isArray(skills)) {
        for (const cat of skills) {
          if (Array.isArray(cat.items)) {
            for (const skill of cat.items) {
              if (skill.toLowerCase().includes(query)) return true;
            }
          }
        }
      }

      return false;
    }
    return true;
  });

  const visibleBase = filteredBase.slice(0, baseLimit);
  const selectedBase = baseResumes.find((resume) => resume.id === selectedBaseId);
  const activeProcessingEntries = Object.entries(processingJobs);
  const nextActionResume = selectedBase || baseResumes[0];
  const metrics = [
    { label: 'Original resumes', value: baseResumes.length, valueClassName: 'stat-value-primary' },
    { label: 'Tailored versions', value: generated.length, valueClassName: 'stat-value-tertiary' },
    {
      label: 'Avg. ATS score',
      value: avgAts ? `${avgAts}%` : 'N/A',
      valueClassName: avgAts ? (avgAts >= 75 ? 'stat-value-success' : avgAts >= 50 ? 'text-warning' : 'text-error') : 'text-muted',
      accessory: avgAts ? <ScoreRing score={avgAts} size={30} strokeWidth={3} showValue={false} /> : null,
    },
    { label: 'PDFs generated', value: generated.filter(r => r.pdfUrl).length, valueClassName: 'stat-value-success' },
  ];

  return (
    <PageShell className="dashboard-page">
      <SectionHeader
        eyebrow={`Welcome back, ${user?.email?.split('@')[0]}`}
        title="Resume workspace"
        description="Start with an original resume, tailor it for a role, then preview and download the strongest version."
        actions={(
          <>
            <button className="btn btn-secondary" onClick={() => navigate('/upload')}>
              <HiOutlineUpload size={18} /> Upload
            </button>
            {nextActionResume && (
              <button className="btn btn-primary" onClick={() => navigate(`/tailor/${nextActionResume.id}`)}>
                <HiOutlineSparkles size={18} /> Tailor resume
              </button>
            )}
          </>
        )}
      />

      <MetricStrip items={metrics} className="dashboard-summary-grid" />

      {!hasContent ? (
        <EmptyState
          icon={(
            <HiOutlineDocumentAdd size={64} />
          )}
          title="No resumes yet"
          description="Upload your first resume to get started with AI-powered tailoring."
          action={(
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/upload')}>
              Upload Your First Resume
            </button>
          )}
        />
      ) : (
        <div className="dashboard-flow-layout mt-8">
          {/* Base Resumes */}
          <div className="dashboard-panel originals-panel">
            <div className="dashboard-section-heading">
              <div>
                <h2 className="title-md">Original Resumes</h2>
                <p className="text-muted">Choose the source resume you want to edit, preview, or tailor.</p>
              </div>
              {selectedBaseId && (
                <button className="btn btn-sm btn-secondary" onClick={() => setSelectedBaseId(null)}>
                  Show all
                </button>
              )}
            </div>
            {filteredBase.length > 0 ? (
              <div className="original-resume-list">
                {visibleBase.map((r) => (
                  <div 
                    key={r.id} 
                    className={`compact-base-card original-resume-card slide-up ${selectedBaseId === r.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBaseId(selectedBaseId === r.id ? null : r.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div style={{ maxWidth: '80%' }}>
                        <div className="label-md truncate">{r.resumeData?.personalInfo?.fullName || 'Untitled Resume'}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.resumeData?.personalInfo?.email || 'No email'}</div>
                      </div>
                      <OverflowMenu items={[
                        { icon: <HiOutlineDocumentText />, label: 'Generate PDF', onClick: () => navigate(`/preview/${r.id}?type=base`) },
                        { icon: <HiOutlineTrash />, label: deleting === r.id ? 'Deleting...' : 'Delete', onClick: () => handleDeleteBase(r.id), danger: true, disabled: deleting === r.id },
                      ]} />
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-sm btn-secondary card-btn" onClick={() => navigate(`/editor/${r.id}`)}>
                        <HiOutlinePencilAlt /> Edit
                      </button>
                      <button className="btn btn-sm btn-primary card-btn" onClick={() => navigate(`/tailor/${r.id}`)}>
                        <HiOutlineSparkles /> Tailor
                      </button>
                    </div>
                  </div>
                ))}
                
                {baseLimit < filteredBase.length && (
                  <div className="show-more-wrapper">
                    <button 
                      className="btn-show-more" 
                      onClick={() => setBaseLimit(prev => prev + 4)}
                    >
                      <span>Show More</span> <HiOutlineChevronDown size={22} className="show-more-icon" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
                <div className="text-muted text-sm empty-state">
                  {baseResumes.length === 0 ? 'No original resumes.' : 'No matches found.'}
                </div>
            )}
          </div>

          {/* Generated Resumes */}
          <div className="dashboard-panel tailored-resumes-main">
            <div className="dashboard-section-heading">
              <div>
                <h2 className="title-md">Tailored Resumes</h2>
                <p className="text-muted">
                  {selectedBase
                    ? `Showing versions created from ${selectedBase.resumeData?.personalInfo?.fullName || 'selected resume'}.`
                    : 'Review generated versions, ATS signals, previews, and downloads.'}
                </p>
              </div>
              {(selectedBaseId || searchQuery) && (
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={() => { setSelectedBaseId(null); setSearchQuery(''); }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Processing cards — one per active tailoring job */}
            {activeProcessingEntries.map(([baseResumeId, job]) => (
              <ProcessingCard
                key={baseResumeId}
                baseResumeId={baseResumeId}
                job={job}
                baseResumes={baseResumes}
              />
            ))}

            {filteredGenerated.length > 0 ? (
              <>
                <div className="deck-container">
                  <AnimatePresence mode="popLayout" initial={false} custom={swipeDirection}>
                    <MotionDiv
                      key={deckIndex}
                      custom={swipeDirection}
                      variants={{
                        enter: (direction) => ({
                          x: direction > 0 ? 800 : -800,
                          opacity: 0,
                          scale: 0.95
                        }),
                        center: {
                          zIndex: 1,
                          x: 0,
                          opacity: 1,
                          scale: 1
                        },
                        exit: (direction) => ({
                          zIndex: 0,
                          x: direction < 0 ? 800 : -800,
                          opacity: 0,
                          scale: 0.95
                        })
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.2 }
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.1}
                      onDragEnd={(e, { offset, velocity }) => {
                        const swipe = Math.abs(offset.x) * velocity.x;
                        const threshold = 10000;
                        if (swipe < -threshold || offset.x < -100) {
                          paginate(1);
                        } else if (swipe > threshold || offset.x > 100) {
                          paginate(-1);
                        }
                      }}
                      className="w-full"
                    >
                      <div className="deck-grid">
                        {chunks[deckIndex]?.map((r) => (
                          <div key={r.id} className={`glass deck-card tailored-card ${!r.pdfUrl ? 'pulse-glow' : 'ambient-glow'}`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="title-md deck-card-title">
                                  {r.summary || 'Tailored Resume'}
                                </div>
                                <div className="deck-card-meta">
                                  <span className="meta-arrow">↳</span>
                                  <span>{baseResumes.find(b => b.id === r.baseResumeId)?.resumeData?.personalInfo?.fullName || 'Base Resume'}</span>
                                  <span className="meta-dot">·</span>
                                  <span className="meta-date">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                                </div>
                              </div>
                              <OverflowMenu items={[
                                { icon: <HiOutlineEye />, label: 'Preview', onClick: () => navigate(`/preview/${r.id}?type=generated`) },
                                ...(r.pdfUrl ? [{ icon: <HiOutlineDownload />, label: 'Download', onClick: () => window.open(r.pdfUrl, '_blank') }] : []),
                                { icon: <HiOutlineTrash />, label: deleting === r.id ? 'Deleting…' : 'Delete', onClick: () => handleDeleteGenerated(r.id), danger: true, disabled: deleting === r.id },
                              ]} />
                            </div>

                            <AnalyticsStrip analytics={r.analytics} />

                            <div className="flex gap-2 justify-end deck-card-actions">
                              <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/preview/${r.id}?type=generated`)}>
                                <HiOutlineEye /> Preview
                              </button>
                              {r.pdfUrl && (
                                <a href={r.pdfUrl} download className="btn btn-sm btn-primary">
                                  <HiOutlineDownload /> Download
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </MotionDiv>
                  </AnimatePresence>
                </div>

                {chunks.length > 1 && (
                  <div className="deck-navigation flex justify-center items-center gap-4 mt-6">
                    <button 
                      className="btn btn-icon btn-secondary deck-nav-btn" 
                      onClick={() => paginate(-1)} 
                      disabled={deckIndex === 0}
                    >
                      <HiOutlineArrowLeft size={20} />
                    </button>
                    
                    <div className="pagination-dots flex items-center gap-2">
                      {chunks.map((_, idx) => (
                        <button
                          key={idx}
                          className={`pagination-dot ${deckIndex === idx ? 'active' : ''}`}
                          onClick={() => {
                            setSwipeDirection(idx > deckIndex ? 1 : -1);
                            setDeckIndex(idx);
                          }}
                          aria-label={`Go to page ${idx + 1}`}
                        />
                      ))}
                      <span className="deck-page-indicator">{deckIndex + 1} / {chunks.length}</span>
                    </div>

                    <button 
                      className="btn btn-icon btn-secondary deck-nav-btn" 
                      onClick={() => paginate(1)} 
                      disabled={deckIndex === chunks.length - 1}
                    >
                      <HiOutlineArrowRight size={20} />
                    </button>
                  </div>
                )}
              </>
            ) : (
                <div className="text-muted empty-state">
                  {generated.length === 0 ? 'No tailored resumes yet. Click "Tailor" on an original resume to create one.' : 'No tailored resumes match your filters.'}
                </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeModal}
        isLoading={!!deleting}
      />
    </PageShell>
  );
}
