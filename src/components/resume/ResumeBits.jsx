import { useEffect, useRef, useState } from 'react';
import {
  HiOutlinePencilAlt, HiOutlineSparkles, HiOutlineDocumentText,
  HiOutlineDocumentAdd, HiOutlineTrash, HiDotsVertical,
  HiOutlineChevronDown, HiOutlineChevronUp,
  HiOutlineShieldCheck, HiOutlineSwitchHorizontal, HiOutlineLightningBolt,
  HiOutlineTag,
} from 'react-icons/hi';
import { Tooltip } from '../ui';

/* ─── Score Ring ─── */
export function ScoreRing({ score, size = 28, strokeWidth = 2.5, showValue = true }) {
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
export function ProcessingCard({ baseResumeId, job, baseResumes }) {
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

      {message && (
        <div className="processing-message-box">{message}</div>
      )}

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

/* ─── Analytics Strip ─── */
export function AnalyticsStrip({ analytics }) {
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

  const getScoreLabel = (score) => {
    if (score >= 86) return 'Exceptional';
    if (score >= 76) return 'Excellent';
    if (score >= 61) return 'Strong';
    if (score >= 41) return 'Moderate';
    return 'Weak';
  };

  return (
    <div>
      <div className="analytics-strip">
        <Tooltip content="ATS Compatibility Score - How well your resume matches this job description based on skills, experience, keywords, and role alignment. Higher is better.">
          <div className="analytics-chip">
            <ScoreRing score={analytics.atsScore} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HiOutlineShieldCheck style={{ color: scoreColor, fontSize: '0.85rem' }} />
              <span className="chip-value" style={{ color: scoreColor }}>{analytics.atsScore}%</span>
              <span className="chip-label-badge">{getScoreLabel(analytics.atsScore)}</span>
            </span>
          </div>
        </Tooltip>
        <Tooltip content="Similarity to Original - How much of your original resume content was preserved. Lower means more was rewritten to match the role.">
          <div className="analytics-chip">
            <HiOutlineSwitchHorizontal style={{ color: simColor, fontSize: '0.85rem' }} />
            <span className="chip-value" style={{ color: simColor }}>{analytics.similarityToOriginal}%</span>
          </div>
        </Tooltip>
        {analytics.matchedKeywords?.length > 0 && (
          <Tooltip content="Matched Keywords - Number of job description keywords successfully incorporated into your resume.">
            <div className="analytics-chip">
              <HiOutlineTag style={{ color: 'var(--tertiary)', fontSize: '0.85rem' }} />
              <span className="chip-value">{analytics.matchedKeywords.length}</span>
            </div>
          </Tooltip>
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
                <Tooltip content="Key Changes - The most significant modifications made to your resume during the tailoring process.">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HiOutlineLightningBolt style={{ color: 'var(--warning)' }} /> Key Changes
                  </span>
                </Tooltip>
              </div>
              <ul className="change-list">
                {analytics.keyChanges.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {analytics.matchedKeywords?.length > 0 && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div className="label-md mb-2" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tooltip content="Matched Keywords - JD keywords that are now present in your tailored resume.">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HiOutlineTag style={{ color: 'var(--success)' }} /> Matched Keywords
                  </span>
                </Tooltip>
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
                <Tooltip content="Missing Keywords - Important JD keywords that couldn't be naturally incorporated. Consider adding these manually.">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HiOutlineTag style={{ color: 'var(--error)' }} /> Missing Keywords
                  </span>
                </Tooltip>
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
export function OverflowMenu({ items }) {
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
export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Delete', isLoading = false }) {
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
