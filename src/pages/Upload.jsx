import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCloudUpload, HiOutlineDocumentText } from 'react-icons/hi';
import api from '../api/client';
import { useNotificationEvents } from '../context/NotificationContext';

export default function Upload() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const { parseProgress, setParseProgress } = useNotificationEvents();

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB.');
      return;
    }

    setError('');
    setUploading(true);
    // Seed an initial stage immediately so UI reacts before SSE arrives
    setParseProgress({ percent: 5, stage: 'Uploading PDF...' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setParseProgress(null);
      navigate(`/editor/${res.data.id}`, { state: { resumeData: res.data.resumeData } });
    } catch (err) {
      setParseProgress(null);
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const activeStage = parseProgress?.stage ?? 'Processing...';
  const activePercent = parseProgress?.percent ?? 5;

  return (
    <div className="page fade-in">
      <div className="mb-6">
        <h1 className="display-sm">Upload Your Resume</h1>
        <p className="body-lg mt-2">Upload a PDF and our AI will parse it into structured, editable data.</p>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {uploading ? (
        <div className="parse-progress-overlay">
          {/* Circular ring */}
          <div className="parse-ring-wrapper">
            <svg className="parse-ring-svg" viewBox="0 0 64 64">
              <circle className="parse-ring-track" cx="32" cy="32" r="28" />
              <circle
                className="parse-ring-fill"
                cx="32" cy="32" r="28"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - activePercent / 100)}`}
              />
            </svg>
            <span className="parse-ring-pct">{activePercent}%</span>
          </div>
          <p className="title-md parse-stage-label">{activeStage}</p>
          <p className="text-muted" style={{ fontSize: '0.82rem' }}>This may take a few seconds</p>
          <div className="parse-linear-track">
            <div className="parse-linear-fill" style={{ width: `${activePercent}%` }} />
          </div>
        </div>
      ) : (
        <div
          className={`upload-zone ${dragging ? 'drag-over' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="upload-icon">
            <HiOutlineCloudUpload size={48} />
          </div>
          <p className="title-md">Drop your PDF here</p>
          <p className="text-muted mt-2">or click to browse files</p>
          <p className="label-md mt-4">
            <HiOutlineDocumentText style={{ verticalAlign: 'middle', marginRight: 4 }} />
            PDF only &bull; Max 5 MB
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}
    </div>
  );
}
