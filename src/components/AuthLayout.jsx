import { useEffect, useRef } from 'react';
import { HiOutlineSparkles, HiOutlineDocumentText, HiOutlineBriefcase, HiOutlineCheckCircle } from 'react-icons/hi';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const HIGHLIGHTS = [
  { icon: <HiOutlineDocumentText />, label: 'Parse any resume in seconds' },
  { icon: <HiOutlineSparkles />, label: 'AI tailoring for every role' },
  { icon: <HiOutlineBriefcase />, label: 'Matched jobs, ranked for you' },
];

/**
 * Split-screen auth shell: a parallax brand hero on the left and the
 * form card (children) on the right. Pointer parallax is transform-only
 * and disabled for users who prefer reduced motion.
 */
export default function AuthLayout({ children }) {
  const stageRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia?.('(hover: none)').matches) return;

    const handleMove = (event) => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        stage.style.setProperty('--px', px.toFixed(3));
        stage.style.setProperty('--py', py.toFixed(3));
      });
    };

    const reset = () => {
      cancelAnimationFrame(frameRef.current);
      stage.style.setProperty('--px', '0');
      stage.style.setProperty('--py', '0');
    };

    stage.addEventListener('pointermove', handleMove);
    stage.addEventListener('pointerleave', reset);
    return () => {
      cancelAnimationFrame(frameRef.current);
      stage.removeEventListener('pointermove', handleMove);
      stage.removeEventListener('pointerleave', reset);
    };
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>

      {/* Brand / parallax hero */}
      <aside className="auth-hero" ref={stageRef} aria-hidden="true">
        <div className="auth-hero-glow" />
        <div className="auth-hero-stage">
          <div className="auth-float auth-float-card" data-depth="3">
            <div className="auth-float-card-head">
              <span className="auth-float-dot" />
              <span className="auth-float-dot" />
              <span className="auth-float-dot" />
            </div>
            <div className="auth-float-line w-70" />
            <div className="auth-float-line w-90" />
            <div className="auth-float-line w-50" />
            <div className="auth-float-line w-80" />
          </div>

          <div className="auth-float auth-float-score" data-depth="6">
            <div className="auth-float-score-ring">
              <span>96</span>
            </div>
            <div className="auth-float-score-meta">
              <strong>Match score</strong>
              <span>ATS optimized</span>
            </div>
          </div>

          <div className="auth-float auth-float-chip auth-float-chip-1" data-depth="9">
            <HiOutlineCheckCircle /> Keywords matched
          </div>
          <div className="auth-float auth-float-chip auth-float-chip-2" data-depth="8">
            <HiOutlineSparkles /> Tailored to JD
          </div>
        </div>

        <div className="auth-hero-copy">
          <div className="auth-hero-brand">
            <Logo size={34} />
            <span>Hirecraft</span>
          </div>
          <h2 className="auth-hero-title">Craft a resume that lands the interview.</h2>
          <p className="auth-hero-sub">
            Upload once, then let AI tailor your resume to any job description and surface the
            roles you are most likely to win.
          </p>
          <ul className="auth-hero-list">
            {HIGHLIGHTS.map((item) => (
              <li key={item.label}>
                <span className="auth-hero-list-icon">{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form column */}
      <div className="auth-panel">{children}</div>
    </div>
  );
}
