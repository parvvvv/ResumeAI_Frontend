import { useState } from 'react';
import { HiOutlineChartPie, HiOutlineExclamationCircle, HiOutlineBadgeCheck, HiChevronDown, HiChevronUp } from 'react-icons/hi';

export default function CareerGapCard({ gapAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  if (!gapAnalysis) return null;

  return (
    <div className={`career-gap-card ${expanded ? 'expanded' : ''}`}>
      <button className="career-gap-header career-gap-toggle" onClick={() => setExpanded(e => !e)}>
        <div className="career-gap-header-left">
          <HiOutlineChartPie className="text-xl" />
          <h3>Readiness Breakdown</h3>
          {!expanded && gapAnalysis.readinessScore != null && (
            <span className="career-gap-score-pill">{gapAnalysis.readinessScore}/100</span>
          )}
        </div>
        {expanded ? <HiChevronUp size={20} /> : <HiChevronDown size={20} />}
      </button>
      
      {expanded && (
      <div className="career-gap-grid">
        <div>
          <h4 className="career-gap-dim-label">Dimensions</h4>
          <div>
            {Object.entries(gapAnalysis.readinessBreakdown || {}).map(([key, data]) => (
              <div key={key} className="career-gap-dim">
                <div className="career-gap-dim-header">
                  <span className="career-gap-dim-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="career-gap-dim-score">{data.score}/{data.max}</span>
                </div>
                <div className="progress-bar-bg" style={{ height: '6px', marginBottom: 'var(--space-1)' }}>
                  <div 
                    className={`progress-bar-fill ${data.score < 50 ? 'bg-error' : data.score < 80 ? 'bg-warning' : 'bg-success'}`} 
                    style={{ width: `${(data.score / data.max) * 100}%` }} 
                  />
                </div>
                <p className="career-gap-dim-reason">{data.reason}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          {gapAnalysis.proofGaps?.length > 0 && (
            <div className="mb-5">
              <h4 className="career-gap-section-title">
                <HiOutlineExclamationCircle className="text-error" /> Proof Gaps
              </h4>
              <p className="career-gap-section-desc">Skills you claim but lack evidence for:</p>
              <div>
                {gapAnalysis.proofGaps.map((gap, i) => (
                  <div key={i} className="career-gap-proof">
                    {gap}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {gapAnalysis.priorityOrder?.length > 0 && (
            <div>
              <h4 className="career-gap-section-title">
                <HiOutlineBadgeCheck className="text-primary" /> Priority Skills to Learn
              </h4>
              <div className="career-gap-priority-list">
                {gapAnalysis.priorityOrder.map((skill, i) => (
                  <span key={i} className="career-gap-priority-item">
                    {i+1}. {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
