import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCloudUpload, HiOutlineDocumentText } from 'react-icons/hi';
import api from '../api/client';

export default function Upload() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const navigate = useNavigate();

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
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/editor/${res.data.id}`, { state: { resumeData: res.data.resumeData } });
    } catch (err) {
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

  return (
    <div className="page fade-in">
      <div className="mb-6">
        <h1 className="display-sm">Upload Your Resume</h1>
        <p className="body-lg mt-2">Upload a PDF and our AI will parse it into structured, editable data.</p>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {uploading ? (
        <div className="loading-overlay">
          <div className="loading-pulse" />
          <p className="title-md">Parsing your resume with AI...</p>
          <p className="text-muted">This may take a few seconds</p>
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
