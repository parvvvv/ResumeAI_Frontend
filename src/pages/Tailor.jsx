import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineSparkles, HiOutlineLightningBolt, HiOutlineClipboardList, HiOutlineShieldCheck } from 'react-icons/hi';
import { useToast } from '../context/ToastContext';
import { useNotificationEvents } from '../context/NotificationContext';

export default function Tailor() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { processingJobs, startTailorStream } = useNotificationEvents();
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If this resume is already being tailored, show that state
  const isProcessing = !!processingJobs[resumeId];

  const handleTailor = () => {
    if (jobDescription.trim().length < 10) {
      setError('Please enter a job description (at least 10 characters).');
      return;
    }
    setError('');
    setSubmitting(true);

    // Start the streaming tailor (runs in background, persists across navigation)
    startTailorStream(resumeId, jobDescription.trim());

    // Show toast and navigate immediately
    addToast('Tailoring in progress — we\'ll notify you when it\'s ready!', 'info', 5000);
    navigate('/dashboard');
  };

  return (
    <div className="page fade-in tailor-page">
      {/* Header with icon */}
      <div className="flex items-start gap-4 mb-6">
        <div className="tailor-header-icon">
          <HiOutlineSparkles />
        </div>
        <div>
          <h1 className="display-sm mb-1">Tailor Resume</h1>
          <p className="body-lg text-muted">Paste a job description and our AI will optimize your resume for maximum ATS compatibility.</p>
        </div>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Job Description Card */}
      <div className="tailor-jd-card mb-6">
        <label className="label-md mb-3" style={{ display: 'block' }}>Job Description</label>
        <textarea
          className="input tailor-textarea w-full"
          rows={10}
          placeholder="Paste the full job description here — include responsibilities, requirements, and preferred qualifications for best results..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
        <div className="tailor-char-count">
          {jobDescription.length} characters
        </div>
      </div>

      <button
        className="btn btn-primary btn-lg btn-lg-mobile w-full"
        onClick={handleTailor}
        disabled={submitting || isProcessing}
      >
        {submitting || isProcessing ? (
          <><span className="spinner" /> {isProcessing ? 'Already tailoring...' : 'Submitting...'}</>
        ) : (
          <><HiOutlineSparkles /> Tailor My Resume</>
        )}
      </button>

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
    </div>
  );
}
