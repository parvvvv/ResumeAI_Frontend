import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineSparkles } from 'react-icons/hi';
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
    <div className="page fade-in" style={{ maxWidth: '900px' }}>
      <h1 className="display-sm mb-2">Tailor Resume</h1>
      <p className="body-lg mb-6">Paste a job description and our AI will optimize your resume for it.</p>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div className="input-group mb-6">
        <label>Job Description</label>
        <textarea
          className="input"
          rows={10}
          placeholder="Paste the full job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          style={{ minHeight: '200px' }}
        />
      </div>

      <button
        className="btn btn-primary btn-lg btn-lg-mobile"
        onClick={handleTailor}
        disabled={submitting || isProcessing}
        style={{ width: '100%' }}
      >
        {submitting || isProcessing ? (
          <><span className="spinner" /> {isProcessing ? 'Already tailoring...' : 'Submitting...'}</>
        ) : (
          <><HiOutlineSparkles /> Tailor My Resume</>
        )}
      </button>
    </div>
  );
}
