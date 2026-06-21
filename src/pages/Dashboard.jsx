import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUpload, HiOutlineSparkles, HiOutlineDocumentText,
  HiOutlineDownload, HiOutlineShieldCheck, HiOutlineDocumentAdd,
  HiOutlineArrowRight, HiOutlineCheckCircle,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useResumes } from '../context/ResumeContext';
import { useNotificationEvents } from '../context/NotificationContext';
import { EmptyState, PageShell } from '../components/ui';
import StudyDashboardWidget from '../components/study-planner/StudyDashboardWidget';

/* ─── Stat Card ─── */
function StatCard({ icon, label, value, accent = 'primary', trend }) {
  return (
    <div className={`stat-card stat-accent-${accent}`}>
      <div className="stat-card-head">
        <span className="stat-card-icon">{icon}</span>
        {trend && <span className={`stat-trend ${trend.dir}`}>{trend.text}</span>}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

/* ─── Relative time ─── */
function timeAgo(input) {
  if (!input) return '';
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(input).toLocaleDateString();
}

/* ─── Recent Activity ─── */
function ActivityFeed({ items }) {
  return (
    <section className="dash-activity">
      <h2 className="dash-section-title">Recent activity</h2>
      {items.length > 0 ? (
        <div className="activity-card">
          <ul className="activity-list">
            {items.map((item, i) => (
              <li key={i}>
                <button type="button" className="activity-item" onClick={item.onClick}>
                  <span className={`activity-icon activity-${item.type}`}>{item.icon}</span>
                  <span className="activity-main">
                    <span className="activity-label truncate">{item.label}</span>
                    <span className="activity-time">{timeAgo(item.at)}</span>
                  </span>
                  {item.pdfUrl && (
                    <span
                      className="activity-action"
                      role="button"
                      tabIndex={0}
                      title="Download PDF"
                      aria-label="Download PDF"
                      onClick={(e) => { e.stopPropagation(); window.open(item.pdfUrl, '_blank'); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); window.open(item.pdfUrl, '_blank'); } }}
                    >
                      <HiOutlineDownload />
                    </span>
                  )}
                  <HiOutlineArrowRight className="activity-arrow" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="activity-empty">
          <p className="activity-empty-text">No recent activity yet</p>
        </div>
      )}
    </section>
  );
}

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const {
    baseResumes, generatedResumes: generated,
    loading: contextLoading, hasInitialFetch, fetchResumes,
  } = useResumes();
  const { processingJobs } = useNotificationEvents();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Capture "now" once per mount so the trend math stays pure across re-renders.
  const [now] = useState(() => Date.now());

  useEffect(() => { fetchResumes(true); }, [fetchResumes]);

  const loading = contextLoading && (!hasInitialFetch || (baseResumes.length === 0 && generated.length === 0));

  if (loading) {
    return <div className="loading-overlay"><div className="loading-pulse" /><p>Loading your workspace...</p></div>;
  }

  const hasContent = baseResumes.length > 0 || generated.length > 0;
  const firstName = (user?.email?.split('@')[0] || 'there').replace(/[._-].*$/, '');
  const nextActionResume = baseResumes[0];
  const activeJobs = Object.keys(processingJobs).length;

  // ── Stats & trends (derived from real createdAt timestamps) ──
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const withinWeek = (r) => r.createdAt && now - new Date(r.createdAt).getTime() < WEEK_MS;
  const newResumesThisWeek = baseResumes.filter(withinWeek).length + generated.filter(withinWeek).length;
  const newGenThisWeek = generated.filter(withinWeek).length;
  const pdfCount = generated.filter((r) => r.pdfUrl).length;

  const scored = generated.filter((r) => r.analytics?.atsScore > 0);
  const avgAts = scored.length
    ? Math.round(scored.reduce((s, r) => s + r.analytics.atsScore, 0) / scored.length)
    : null;
  const mean = (arr) => (arr.length ? arr.reduce((s, r) => s + r.analytics.atsScore, 0) / arr.length : null);
  const recentAtsAvg = mean(scored.filter(withinWeek));
  const olderAtsAvg = mean(scored.filter((r) => !withinWeek(r)));
  const atsDelta = recentAtsAvg != null && olderAtsAvg != null ? Math.round(recentAtsAvg - olderAtsAvg) : null;

  const statCards = [
    {
      icon: <HiOutlineDocumentText />, accent: 'primary', label: 'Total resumes',
      value: baseResumes.length + generated.length,
      trend: newResumesThisWeek > 0 ? { dir: 'up', text: `+${newResumesThisWeek} this week` } : null,
    },
    {
      icon: <HiOutlineShieldCheck />,
      accent: avgAts == null ? 'muted' : avgAts >= 75 ? 'success' : avgAts >= 50 ? 'warning' : 'error',
      label: 'Avg. ATS score', value: avgAts ? `${avgAts}%` : 'N/A',
      trend: atsDelta != null && atsDelta !== 0 ? { dir: atsDelta > 0 ? 'up' : 'down', text: `${atsDelta > 0 ? '▲' : '▼'} ${Math.abs(atsDelta)}%` } : null,
    },
    {
      icon: <HiOutlineSparkles />, accent: 'tertiary', label: 'Tailored versions',
      value: generated.length,
      trend: newGenThisWeek > 0 ? { dir: 'up', text: `+${newGenThisWeek} this week` } : null,
    },
    { icon: <HiOutlineDownload />, accent: 'success', label: 'PDFs generated', value: pdfCount },
  ];

  // ── Recent activity ──
  const baseName = (id) => baseResumes.find((b) => b.id === id)?.resumeData?.personalInfo?.fullName || 'resume';
  const activityItems = [
    ...generated.map((r) => ({
      type: 'tailor', at: r.createdAt, icon: <HiOutlineSparkles />,
      label: r.analytics?.atsScore ? `Tailored ${baseName(r.baseResumeId)} · ATS ${r.analytics.atsScore}%` : `Tailored ${baseName(r.baseResumeId)}`,
      onClick: () => navigate(`/preview/${r.id}?type=generated`),
      pdfUrl: r.pdfUrl || null,
    })),
    ...baseResumes.map((r) => ({
      type: 'upload', at: r.createdAt, icon: <HiOutlineUpload />,
      label: `Uploaded ${r.resumeData?.personalInfo?.fullName || 'resume'}`,
      onClick: () => navigate(`/editor/${r.id}`),
    })),
  ].filter((x) => x.at).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);

  // ── "Jump back in" — only pending / actionable resumes ──
  const pendingGenerated = [...generated]
    .filter((r) => r.createdAt && !r.pdfUrl)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);
  const pendingItems = pendingGenerated.map((r) => ({
    id: r.id, kind: 'generated',
    title: r.summary || 'Tailored Resume',
    sub: `↳ ${baseName(r.baseResumeId)}`,
    score: r.analytics?.atsScore || null,
  }));

  return (
    <PageShell className="dashboard-page">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <p className="dash-hero-eyebrow">Welcome back</p>
          <h1 className="dash-hero-title">
            Hi {firstName.charAt(0).toUpperCase() + firstName.slice(1)} <span className="dash-hero-wave">👋</span>
          </h1>
          <p className="dash-hero-sub">Create ATS-optimized resumes for any role in seconds.</p>
          <div className="dash-hero-actions">
            {nextActionResume ? (
              <>
                <button className="btn btn-primary btn-lg" onClick={() => navigate(`/tailor/${nextActionResume.id}`)}>
                  <HiOutlineSparkles size={18} /> Tailor Resume
                </button>
                <button className="btn btn-secondary btn-lg" onClick={() => navigate('/upload')}>
                  <HiOutlineUpload size={18} /> Upload Resume
                </button>
              </>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/upload')}>
                <HiOutlineUpload size={18} /> Upload Resume
              </button>
            )}
          </div>
        </div>
      </header>

      {activeJobs > 0 && (
        <button className="dash-processing-banner" onClick={() => navigate('/resumes')}>
          <span className="dash-processing-spinner" />
          {activeJobs === 1 ? 'A resume is being tailored…' : `${activeJobs} resumes are being tailored…`}
          <span className="dash-processing-link">View progress <HiOutlineArrowRight /></span>
        </button>
      )}

      {!hasContent ? (
        <EmptyState
          icon={<HiOutlineDocumentAdd size={64} />}
          title="No resumes yet"
          description="Upload your first resume and start tailoring it for the jobs you want."
          action={(
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/upload')}>
              <HiOutlineUpload size={18} /> Upload Your First Resume
            </button>
          )}
        />
      ) : (
        <>
          <div className="stat-grid">
            {statCards.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          <StudyDashboardWidget />

          <div className="dash-columns mt-8">
            <section className="dash-resumes">
              <div className="dash-section-head">
                <h2 className="dash-section-title">Jump back in</h2>
                {pendingItems.length > 0 && (
                  <button className="link-btn" onClick={() => navigate('/resumes')}>
                    View all <HiOutlineArrowRight />
                  </button>
                )}
              </div>
              {pendingItems.length > 0 ? (
                <div className="recent-resume-list">
                  {pendingItems.map((item) => (
                    <button
                      key={`${item.kind}-${item.id}`}
                      className="recent-resume-row compact"
                      onClick={() => navigate(item.kind === 'generated' ? `/preview/${item.id}?type=generated` : `/editor/${item.id}`)}
                    >
                      <span className={`recent-resume-icon ${item.kind}`}>
                        {item.kind === 'generated' ? <HiOutlineSparkles /> : <HiOutlineDocumentText />}
                      </span>
                      <span className="recent-resume-main">
                        <span className="recent-resume-title truncate">{item.title}</span>
                        <span className="recent-resume-sub truncate">{item.sub}</span>
                      </span>
                      {item.score != null && (
                        <span
                          className="recent-resume-score"
                          data-band={item.score >= 75 ? 'good' : item.score >= 50 ? 'mid' : 'low'}
                        >
                          {item.score}%
                        </span>
                      )}
                      <HiOutlineArrowRight className="recent-resume-arrow" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="jump-empty-state">
                  <span className="jump-empty-icon"><HiOutlineCheckCircle /></span>
                  <div className="jump-empty-copy">
                    <p className="jump-empty-title">All caught up!</p>
                    <p className="jump-empty-desc">No resumes pending for action</p>
                  </div>
                </div>
              )}
            </section>

            <ActivityFeed items={activityItems} />
          </div>
        </>
      )}
    </PageShell>
  );
}
