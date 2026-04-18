/**
 * TopProgressBar — a thin, full-width Stripe/Linear-style progress bar
 * that sits above the navbar. Receives a `progress` prop (0–100).
 * When progress is null/undefined the bar is hidden entirely.
 */
import { useEffect, useState } from 'react';

export default function TopProgressBar({ progress, stage }) {
  const [visible, setVisible] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);

  // Control visibility — show when progress is active, hide after 100%
  useEffect(() => {
    if (progress == null) {
      setVisible(false);
      return;
    }
    setVisible(true);
    // Smooth update
    setDisplayProgress(progress);

    // Auto-hide 800ms after reaching 100%
    if (progress >= 100) {
      const t = setTimeout(() => setVisible(false), 800);
      return () => clearTimeout(t);
    }
  }, [progress, stage]);

  if (!visible) return null;

  return (
    <div className="top-progress-wrapper" role="progressbar" aria-valuenow={displayProgress} aria-valuemin={0} aria-valuemax={100}>
      {/* Track */}
      <div className="top-progress-track">
        {/* Filled bar */}
        <div
          className="top-progress-bar"
          style={{ width: `${displayProgress}%` }}
        >
          {/* Shimmer overlay */}
          <div className="top-progress-shimmer" />
        </div>
        {/* Glow head */}
        {displayProgress > 0 && displayProgress < 100 && (
          <div
            className="top-progress-glow-head"
            style={{ left: `${displayProgress}%` }}
          />
        )}
      </div>
      {/* Stage label — floats under the bar, right-aligned */}
      {stage && (
        <div className="top-progress-stage-label">
          {stage}
        </div>
      )}
    </div>
  );
}
