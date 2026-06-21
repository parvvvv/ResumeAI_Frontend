import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineSparkles, HiOutlineLightningBolt, HiOutlineClipboardList, HiOutlineShieldCheck, HiOutlineRefresh } from 'react-icons/hi';
import { useToast } from '../context/ToastContext';
import { useNotificationEvents } from '../context/NotificationContext';
import { ActionBar, PageShell, SectionHeader } from '../components/ui';

const INTENSITY_LEVELS = [
  { value: 0, label: 'Auto', hint: 'AI decides the best intensity based on how well your resume matches the job' },
  { value: 25, label: 'Light', hint: 'Minor enhancements \u2014 keep ~70% of your resume intact, just polish wording and keywords' },
  { value: 50, label: 'Moderate', hint: 'Balanced rewrite \u2014 reframe ~50% of content to better match the target role' },
  { value: 75, label: 'Heavy', hint: 'Significant rewrite \u2014 reshape ~70% of bullet points toward the new role' },
  { value: 100, label: 'Transform', hint: 'Complete transformation \u2014 rewrite nearly everything for a career pivot' },
];

function getCurrentLevel(value) {
  if (value === 0) return INTENSITY_LEVELS[0];
  if (value <= 25) return INTENSITY_LEVELS[1];
  if (value <= 50) return INTENSITY_LEVELS[2];
  if (value <= 75) return INTENSITY_LEVELS[3];
  return INTENSITY_LEVELS[4];
}

export default function Tailor() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { processingJobs, startTailorStream } = useNotificationEvents();
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rewriteIntensity, setRewriteIntensity] = useState(0);

  const isProcessing = !!processingJobs[resumeId];
  const currentLevel = getCurrentLevel(rewriteIntensity);

  const handleTailor = () => {
    if (jobDescription.trim().length < 10) {
      setError('Please enter a job description (at least 10 characters).');
      return;
    }
    setError('');
    setSubmitting(true);

    startTailorStream(resumeId, jobDescription.trim(), rewriteIntensity || undefined);

    addToast('Tailoring in progress - we\'ll notify you when it\'s ready!', 'info', 5000);
    navigate('/dashboard');
  };

  return (
    <PageShell className="tailor-page">
      <SectionHeader
        title="Tailor Resume"
        description="Paste a job description and our AI will optimize your resume for maximum ATS compatibility."
        icon={<HiOutlineSparkles />}
      />

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Job Description Card */}
      <div className="tailor-jd-card mb-6">
        <label className="label-md mb-3" style={{ display: 'block' }}>Job Description</label>
        <textarea
          className="input tailor-textarea w-full"
          rows={10}
          placeholder="Paste the full job description here \u2014 include responsibilities, requirements, and preferred qualifications for best results..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <div className="tailor-char-count">
          {jobDescription.length} characters
        </div>
      </div>

      {/* Rewrite Intensity Slider */}
      <div className="intensity-card mb-6">
        <div className="intensity-header">
          <div className="intensity-header-left">
            <span className="intensity-label">Rewrite Intensity</span>
            <span className="intensity-badge">{currentLevel.label}</span>
            {rewriteIntensity > 0 && (
              <span className="intensity-percentage">{rewriteIntensity}%</span>
            )}
          </div>
          {rewriteIntensity > 0 && (
            <button
              className="intensity-reset-btn"
              onClick={() => setRewriteIntensity(0)}
              title="Reset to Auto"
            >
              <HiOutlineRefresh /> Auto
            </button>
          )}
        </div>

        <div className="intensity-slider-container">
          <div className="intensity-track">
            <div
              className="intensity-track-fill"
              style={{ width: `${rewriteIntensity}%` }}
            />
          </div>
          <input
            type="range"
            className="intensity-slider"
            min="0"
            max="100"
            step="1"
            value={rewriteIntensity}
            onChange={(e) => setRewriteIntensity(Number(e.target.value))}
          />
          <div className="intensity-ticks">
            {INTENSITY_LEVELS.map((level) => (
              <div
                key={level.value}
                className={`intensity-tick ${rewriteIntensity >= level.value ? 'active' : ''}`}
                style={{ left: `${level.value}%` }}
                onClick={() => setRewriteIntensity(level.value)}
              >
                <span className="tick-dot" />
                <span className="tick-label">{level.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hint Box */}
        <div className="intensity-hint-box">
          <span className="intensity-hint-text">{currentLevel.hint}</span>
        </div>
      </div>

      <ActionBar sticky className="tailor-action-bar">
        <button
          className="btn btn-primary btn-lg w-full"
          onClick={handleTailor}
          disabled={submitting || isProcessing}
        >
          {submitting || isProcessing ? (
            <><span className="spinner" /> {isProcessing ? 'Already tailoring...' : 'Submitting...'}</>
          ) : (
            <><HiOutlineSparkles /> Tailor My Resume</>
          )}
        </button>
      </ActionBar>

      {/* Tips Section */}
      <div className="tailor-tips">
        <div className="tailor-tip-card">
          <div className="tailor-tip-icon icon-badge primary">
            <HiOutlineClipboardList />
          </div>
          <div className="tailor-tip-text">
            <h4>Full description</h4>
            <p>Include the complete job posting for the best keyword matching.</p>
          </div>
        </div>
        <div className="tailor-tip-card">
          <div className="tailor-tip-icon icon-badge success">
            <HiOutlineShieldCheck />
          </div>
          <div className="tailor-tip-text">
            <h4>ATS optimized</h4>
            <p>Our AI restructures content to pass applicant tracking systems.</p>
          </div>
        </div>
        <div className="tailor-tip-card">
          <div className="tailor-tip-icon icon-badge warning">
            <HiOutlineLightningBolt />
          </div>
          <div className="tailor-tip-text">
            <h4>Fast results</h4>
            <p>Tailoring takes about 30 seconds. You'll be notified when done.</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
