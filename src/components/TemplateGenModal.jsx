import { useEffect, useRef, useState } from 'react';
import { HiOutlineDocumentText, HiOutlinePhotograph, HiOutlineUpload, HiX } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { MobileSheet } from './ui';

export default function TemplateGenModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jobState, setJobState] = useState(null); // 'uploading', 'queued', 'processing', 'completed', 'failed', 'needs_review'
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setJobState(null);
      setJobId(null);
      setError('');
    }
  }, [isOpen]);

  // Polling logic
  useEffect(() => {
    let timeoutId;
    let isCancelled = false;

    const pollJobStatus = async () => {
      if (!jobId || isCancelled) return;
      try {
        const res = await api.get(`/templates/generate/${jobId}/status`);
        const { status, templateId: resultTemplateId, errorMessage } = res.data;

        if (!isCancelled) {
          setJobState(status);

          if (status === 'completed' || status === 'needs_review') {
            if (resultTemplateId) {
              addToast('AI Draft generated successfully.', 'success');
              navigate(`/templates/${resultTemplateId}`);
              onClose();
            } else {
              setJobState('failed');
              setError('Job completed but no template ID was returned.');
            }
          } else if (status === 'failed') {
            setError(errorMessage || 'AI Generation failed. Please try again.');
          } else {
            // still processing or queued, poll again in 3s
            timeoutId = setTimeout(pollJobStatus, 3000);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setJobState('failed');
          setError(err.response?.data?.detail || 'Failed to poll job status.');
        }
      }
    };

    if (jobId && (jobState === 'queued' || jobState === 'processing')) {
      pollJobStatus();
    }

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [jobId, jobState, navigate, addToast, onClose]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;
    setError('');
    
    // File size limit: 5MB for images, 1MB for HTML
    const isImage = selectedFile.type.startsWith('image/');
    
    if (!isImage) {
      setError('Please upload an Image (PNG/JPG).');
      return;
    }

    if (isImage && selectedFile.size > 5 * 1024 * 1024) {
      setError('Image file must be under 5MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleGenerate = async () => {
    if (!file) return;
    
    setJobState('uploading');
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/templates/generate/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setJobId(res.data.jobId);
      setJobState(res.data.status || 'queued');
    } catch (err) {
      setJobState('failed');
      setError(err.response?.data?.detail || 'Failed to initiate AI generation.');
    }
  };

  const getStatusMessage = () => {
    switch (jobState) {
      case 'uploading': return 'Uploading file...';
      case 'queued': return 'Waiting in queue...';
      case 'processing': return 'AI is analyzing and templatizing your file...';
      case 'completed': return 'Finalizing draft...';
      case 'needs_review': return 'Draft ready for review...';
      default: return '';
    }
  };

  return (
    <MobileSheet isOpen={isOpen} onClose={() => { if (!['uploading', 'queued', 'processing'].includes(jobState)) onClose(); }} labelledBy="template-gen-title">
      <div className="flex justify-between items-center mb-6">
        <h2 id="template-gen-title" className="sheet-title">Generate AI Draft</h2>
        {!['uploading', 'queued', 'processing'].includes(jobState) && (
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <HiX />
          </button>
        )}
      </div>

      <p className="text-muted text-sm mb-6">
        Upload a screenshot or design image of a resume. 
        Our AI will automatically detect layouts and text, convert it to HTML, and replace hardcoded values (like names and emails) with dynamic Jinja placeholders.
      </p>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Upload State */}
      {!jobState || jobState === 'failed' ? (
        <>
          <div
            className={`upload-zone mb-6 ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/png,image/jpeg,image/jpg"
              style={{ display: 'none' }}
            />
            {file ? (
              <div className="flex flex-col items-center">
                <HiOutlinePhotograph className="upload-icon" />
                <span className="title-md">{file.name}</span>
                <span className="text-muted text-sm mt-1">Click or drag to change file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <HiOutlineUpload className="upload-icon" />
                <span className="title-md">Drop Image here</span>
                <span className="text-muted text-sm mt-2">Supports .png, .jpg (Max 5MB)</span>
              </div>
            )}
          </div>

          <button 
            className="btn btn-primary btn-lg w-full" 
            disabled={!file} 
            onClick={handleGenerate}
          >
            Generate Template Draft
          </button>
        </>
      ) : (
        /* Polling State */
        <div className="flex flex-col items-center py-8">
          <div className="loading-pulse mb-6" style={{ width: 64, height: 64 }} />
          <h3 className="title-md mb-2">{getStatusMessage()}</h3>
          <p className="text-muted text-sm text-center">
            This usually takes 15-30 seconds depending on the complexity of the file. Please do not close this window.
          </p>
        </div>
      )}
    </MobileSheet>
  );
}
