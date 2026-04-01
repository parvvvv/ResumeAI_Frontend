import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUpload, HiOutlinePencilAlt, HiOutlineSparkles,
  HiOutlineDocumentText, HiOutlineDownload, HiOutlineEye,
  HiOutlineDocumentAdd, HiOutlineTrash, HiDotsVertical,
  HiOutlineChevronDown, HiOutlineChevronUp,
  HiOutlineShieldCheck, HiOutlineSwitchHorizontal,
  HiOutlineLightningBolt, HiOutlineTag,
} from 'react-icons/hi';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNotificationEvents } from '../context/NotificationContext';
import { useSearch } from '../context/SearchContext';

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
  if (!isOpen) return null;

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

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
  const [baseResumes, setBaseResumes] = useState([]);
  const [generated, setGenerated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [selectedBaseId, setSelectedBaseId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [baseLimit, setBaseLimit] = useState(4);
  const [generatedLimit, setGeneratedLimit] = useState(4);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { onEvent, offEvent } = useNotificationEvents();
  const { searchQuery, setSearchQuery } = useSearch();

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    try {
      const [baseRes, genRes] = await Promise.all([
        api.get('/resume'),
        api.get('/dashboard'),
      ]);
      setBaseResumes(baseRes.data.resumes || []);
      setGenerated(genRes.data.resumes || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Subscribe to SSE events for auto-refresh ──
  useEffect(() => {
    const handleTailorComplete = () => {
      fetchData();
    };

    const handlePdfReady = () => {
      fetchData();
    };

    onEvent('tailor_complete', handleTailorComplete);
    onEvent('pdf_ready', handlePdfReady);

    return () => {
      offEvent('tailor_complete', handleTailorComplete);
      offEvent('pdf_ready', handlePdfReady);
    };
  }, [onEvent, offEvent, fetchData]);

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
          await api.delete(`/resume/${id}`);
          setBaseResumes(r => r.filter(x => x.id !== id));
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
          await api.delete(`/resume/generated/${id}`);
          setGenerated(r => r.filter(x => x.id !== id));
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
      return name.toLowerCase().includes(query);
    }
    return true;
  });

  const filteredGenerated = generated.filter((r) => {
    if (selectedBaseId && r.baseResumeId !== selectedBaseId) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const baseCandidate = baseResumes.find(b => b.id === r.baseResumeId)?.resumeData?.personalInfo?.fullName || '';
      return (
        (r.summary && r.summary.toLowerCase().includes(query)) ||
        (baseCandidate && baseCandidate.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const visibleBase = filteredBase.slice(0, baseLimit);
  const visibleGenerated = filteredGenerated.slice(0, generatedLimit);

  return (
    <div className="page fade-in" style={{ paddingBottom: '140px' }}>
      {/* Hero */}
      <div className="glass ambient-glow mb-8 flex flex-col items-center justify-center text-center" style={{ padding: '2rem 1.5rem', borderRadius: '1.25rem' }}>
        <h1 className="display-sm mb-3">Welcome back, {user?.email?.split('@')[0]} 👋</h1>
        <p className="body-lg text-muted mb-6" style={{ maxWidth: '600px' }}>
          {hasContent 
            ? "Manage your resumes and generate AI-tailored variations optimized for applicant tracking systems." 
            : "Your AI tailoring workspace is ready. Upload a resume to get started."}
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/upload')}>
          <HiOutlineUpload size={20} /> Upload New Resume
        </button>
      </div>

      {/* Quick Stats */}
      {hasContent && (
        <div className="stats-carousel">
          
          <div className="glass ambient-glow flex flex-col justify-between items-center text-center" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div className="label-md text-muted mb-4">Original Resumes</div>
            <div className="display-sm" style={{ color: 'var(--primary)' }}>{baseResumes.length}</div>
          </div>
          
          <div className="glass ambient-glow flex flex-col justify-between items-center text-center" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div className="label-md text-muted mb-4">Tailored Versions</div>
            <div className="display-sm" style={{ color: 'var(--tertiary)' }}>{generated.length}</div>
          </div>
          
          <div className="glass ambient-glow flex flex-col items-center text-center" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div className="label-md text-muted mb-4">Avg. ATS Score</div>
            <div className="flex items-center gap-3">
              <div className="display-sm" style={{
                color: avgAts ? (avgAts >= 75 ? 'var(--success)' : avgAts >= 50 ? 'var(--warning)' : 'var(--error)') : 'var(--outline)'
              }}>
                {avgAts ? `${avgAts}%` : 'N/A'}
              </div>
              {avgAts && <ScoreRing score={avgAts} size={32} strokeWidth={3} showValue={false} />}
            </div>
          </div>
          
          <div className="glass ambient-glow flex flex-col justify-between items-center text-center" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <div className="label-md text-muted mb-4">PDFs Generated</div>
            <div className="display-sm" style={{ color: 'var(--success)' }}>
              {generated.filter(r => r.pdfUrl).length}
            </div>
          </div>
          
        </div>
      )}

      {!hasContent ? (
        <div className="card card-elevated text-center" style={{ padding: 'var(--space-16)' }}>
          <div style={{ marginBottom: 'var(--space-4)', color: 'var(--primary)', opacity: 0.6 }}>
            <HiOutlineDocumentAdd size={64} />
          </div>
          <h2 className="display-sm mb-4">No resumes yet</h2>
          <p className="body-lg mb-6">Upload your first resume to get started with AI-powered tailoring.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/upload')}>
            Upload Your First Resume
          </button>
        </div>
      ) : (
        <div className="dashboard-layout mt-8">
          {/* Base Resumes */}
          <div className="base-resumes-sidebar">
            <h2 className="title-md mb-4 flex items-center gap-2">
              <span className="text-primary">●</span> Originals
            </h2>
            {filteredBase.length > 0 ? (
              <div className="flex flex-col gap-3">
                {visibleBase.map((r) => (
                  <div 
                    key={r.id} 
                    className={`compact-base-card slide-up ${selectedBaseId === r.id ? 'active' : ''}`}
                    onClick={() => setSelectedBaseId(selectedBaseId === r.id ? null : r.id)}
                    style={{ cursor: 'pointer', transition: 'all 0.2s', border: selectedBaseId === r.id ? '1px solid var(--primary)' : '1px solid transparent', backgroundColor: selectedBaseId === r.id ? 'var(--surface-container-high)' : undefined }}
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
                      <button className="btn btn-sm btn-secondary" style={{ flex: 1, padding: '4px' }} onClick={() => navigate(`/editor/${r.id}`)}>
                        <HiOutlinePencilAlt /> Edit
                      </button>
                      <button className="btn btn-sm btn-primary" style={{ flex: 1, padding: '4px' }} onClick={() => navigate(`/tailor/${r.id}`)}>
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
                <div className="text-muted text-sm" style={{ padding: 'var(--space-4)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)' }}>
                  {baseResumes.length === 0 ? 'No original resumes.' : 'No matches found.'}
                </div>
            )}
          </div>

          {/* Generated Resumes */}
          <div className="tailored-resumes-main">
            <div className="flex justify-between items-center mb-4">
              <h2 className="display-sm">
                <span style={{ color: 'var(--tertiary)' }}>●</span> Tailored Resumes
              </h2>
              {(selectedBaseId || searchQuery) && (
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={() => { setSelectedBaseId(null); setSearchQuery(''); }}
                >
                  Clear Filters
                </button>
              )}
            </div>
            {filteredGenerated.length > 0 ? (
              <>
                <div className="grid-cards" style={{ gap: '1.5rem' }}>
                  {visibleGenerated.map((r) => (
                    <div key={r.id} className={`glass slide-up ${!r.pdfUrl ? 'pulse-glow' : 'ambient-glow'}`} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                      {/* Card Header */}
                      <div className="flex justify-between items-start">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="title-md" style={{ marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.summary || 'Tailored Resume'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                            <span style={{ color: 'var(--primary)', opacity: 0.7 }}>↳</span>
                            <span>{baseResumes.find(b => b.id === r.baseResumeId)?.resumeData?.personalInfo?.fullName || 'Base Resume'}</span>
                            <span style={{ opacity: 0.35 }}>·</span>
                            <span style={{ opacity: 0.5 }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                        <OverflowMenu items={[
                          { icon: <HiOutlineEye />, label: 'Preview', onClick: () => navigate(`/preview/${r.id}?type=generated`) },
                          ...(r.pdfUrl ? [{ icon: <HiOutlineDownload />, label: 'Download', onClick: () => window.open(r.pdfUrl, '_blank') }] : []),
                          { icon: <HiOutlineTrash />, label: deleting === r.id ? 'Deleting…' : 'Delete', onClick: () => handleDeleteGenerated(r.id), danger: true, disabled: deleting === r.id },
                        ]} />
                      </div>

                      {/* Analytics */}
                      <AnalyticsStrip analytics={r.analytics} />

                      {/* Actions */}
                      <div className="flex gap-2 justify-end" style={{ marginTop: '12px' }}>
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
                
                {generatedLimit < filteredGenerated.length && (
                  <div className="show-more-wrapper">
                    <button 
                      className="btn-show-more" 
                      onClick={() => setGeneratedLimit(prev => prev + 4)}
                    >
                      <span>Show More</span> <HiOutlineChevronDown size={22} className="show-more-icon" />
                    </button>
                  </div>
                )}
              </>
            ) : (
                <div className="text-muted" style={{ padding: 'var(--space-8)', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
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
    </div>
  );
}
