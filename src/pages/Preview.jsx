import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { HiOutlineDocumentText } from 'react-icons/hi';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { ActionBar, PageShell, ResponsiveCardList, SectionHeader } from '../components/ui';

export default function Preview() {
  const { resumeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isGenerated = searchParams.get('type') === 'generated';
  const [template, setTemplate] = useState('modern');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  const handleGenerate = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post('/resume/generate-pdf', {
        resumeId,
        templateName: template,
        isGenerated,
      });
      addToast('PDF generating — we\'ll notify you when ready.', 'info', 4000);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start PDF generation.');
      setSubmitting(false);
    }
  };

  return (
    <PageShell className="preview-page">
      <SectionHeader
        title="Generate PDF"
        description="Choose a template and generate a downloadable PDF resume."
        icon={<HiOutlineDocumentText />}
      />

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* Template Selection */}
      <div className="mb-6">
        <div className="label-md mb-4">Select Template</div>
        <ResponsiveCardList className="template-selection-grid">
          <TemplateCard
            name="modern"
            label="Modern"
            description="Clean design with serif font, professional layout"
            selected={template === 'modern'}
            onClick={() => setTemplate('modern')}
          />
          <TemplateCard
            name="ats"
            label="ATS-Friendly"
            description="Minimal serif layout, optimized for ATS parsing"
            selected={template === 'ats'}
            onClick={() => setTemplate('ats')}
          />
        </ResponsiveCardList>
      </div>

      <ActionBar sticky>
        <button className="btn btn-primary btn-lg w-full" onClick={handleGenerate} disabled={submitting}>
          {submitting ? (
            <><span className="spinner" /> Submitting...</>
          ) : (
            <><HiOutlineDocumentText /> Generate PDF</>
          )}
        </button>
      </ActionBar>
    </PageShell>
  );
}

function TemplateCard({ name, label, description, selected, onClick }) {
  return (
    <div
      className={`card card-hover template-card ${selected ? 'selected ambient-glow-active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      aria-pressed={selected}
    >
      {/* Mini preview thumbnail */}
      <div className={`template-card-preview ${name}`}>
        <div className="preview-bar header" />
        <div className="preview-bar" style={{ width: '70%' }} />
        <div className="preview-bar" style={{ width: '90%' }} />
        <div className="preview-bar" style={{ width: '55%' }} />
        <div className="preview-bar" style={{ width: '80%' }} />
        <div className="preview-bar" style={{ width: '40%' }} />
      </div>
      
      <div className="flex items-center gap-3 mb-2">
        <div className={`template-radio ${selected ? 'selected' : ''}`} />
        <span className="title-md">{label}</span>
      </div>
      <p className="text-muted text-sm">{description}</p>
    </div>
  );
}
