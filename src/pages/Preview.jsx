import { useEffect, useMemo, useState } from 'react';
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
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  // Load available templates from DB
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const res = await api.get('/resume/templates/available');
        const list = res.data?.templates || [];
        setTemplates(list);
        // Auto-select first template
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
        setError('Failed to load templates.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [sessionExtras, setSessionExtras] = useState({});
  const [sessionLoading, setSessionLoading] = useState(false);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedId);
  }, [templates, selectedId]);

  const templateFields = selectedTemplate?.templateSchema?.fields || [];

  // Load session when a template with fields is selected
  useEffect(() => {
    if (!selectedId || templateFields.length === 0) {
      setSessionExtras({});
      return;
    }
    
    let cancelled = false;
    const fetchSession = async () => {
      setSessionLoading(true);
      try {
        const res = await api.get(`/templates/${selectedId}/session`, {
          params: { resumeId }
        });
        if (!cancelled) {
          setSessionExtras(res.data?.extras || {});
        }
      } catch (err) {
        console.error('Failed to load template session:', err);
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    };
    fetchSession();
    
    return () => { cancelled = true; };
  }, [selectedId, resumeId, templateFields.length]);

  const handleExtraChange = (key, value) => {
    setSessionExtras((curr) => ({ ...curr, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedId) {
      setError('Please select a template first.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      // If there are dynamic fields, save the session first
      if (templateFields.length > 0) {
        await api.put(`/templates/${selectedId}/session?resumeId=${resumeId}`, {
          extras: sessionExtras
        });
      }

      await api.post('/resume/generate-pdf', {
        resumeId,
        templateId: selectedId,
        isGenerated,
      });
      addToast('PDF generating - we\'ll notify you when ready.', 'info', 4000);
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
        {loading ? (
          <div className="loading-overlay"><div className="loading-pulse" /><p>Loading templates...</p></div>
        ) : templates.length === 0 ? (
          <div className="text-muted text-center py-8">No templates available. Contact your admin.</div>
        ) : (
          <ResponsiveCardList className="template-selection-grid">
            {templates.map((tmpl) => (
              <TemplateCard
                key={tmpl.id}
                template={tmpl}
                selected={selectedId === tmpl.id}
                onClick={() => setSelectedId(tmpl.id)}
                resumeId={resumeId}
                isGenerated={isGenerated}
              />
            ))}
          </ResponsiveCardList>
        )}
      </div>

      {/* Dynamic Form for Template Session */}
      {templateFields.length > 0 && (
        <div className="mb-6 fade-in p-6 bg-surface-container rounded-xl border border-outline-variant">
          <h3 className="title-md mb-2">Template Options</h3>
          <p className="text-sm text-muted mb-6">This template requires additional information. These details will be saved for future use with this template.</p>
          
          {sessionLoading ? (
            <div className="loading-pulse" style={{ height: '100px', width: '100%' }} />
          ) : (
            <div className="flex flex-col gap-4">
              {templateFields.map((field) => (
                <div key={field.key} className="input-group">
                  <label>
                    {field.label} {field.required && <span className="text-error">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea 
                      className="input" 
                      style={{ minHeight: '80px' }}
                      value={sessionExtras[field.key] || ''}
                      onChange={(e) => handleExtraChange(field.key, e.target.value)}
                      placeholder={field.description}
                    />
                  ) : field.type === 'select' && field.options ? (
                    <select
                      className="input"
                      value={sessionExtras[field.key] || ''}
                      onChange={(e) => handleExtraChange(field.key, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text"
                      className="input"
                      value={sessionExtras[field.key] || ''}
                      onChange={(e) => handleExtraChange(field.key, e.target.value)}
                      placeholder={field.description}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ActionBar sticky>
        <button className="btn btn-primary btn-lg w-full" onClick={handleGenerate} disabled={submitting || !selectedId}>
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

function TemplateCard({ template, selected, onClick, resumeId, isGenerated }) {
  const [livePreviewHtml, setLivePreviewHtml] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // On selection, load a live preview with actual resume data
  useEffect(() => {
    if (!selected || !resumeId || !template.id) return;
    let cancelled = false;

    const fetchLivePreview = async () => {
      setLoadingPreview(true);
      try {
        const res = await api.post('/resume/templates/preview-with-data', {
          resumeId,
          templateId: template.id,
          isGenerated,
        });
        if (!cancelled) {
          setLivePreviewHtml(res.data.html);
        }
      } catch {
        // Fall back to seed preview on error
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    };

    fetchLivePreview();
    return () => { cancelled = true; };
  }, [selected, resumeId, template.id, isGenerated]);

  // Show live preview if selected and available, otherwise seed preview
  const displayHtml = useMemo(() => {
    if (selected && livePreviewHtml) return livePreviewHtml;
    return template.previewHtml || '<html><body><div style="padding:24px;font-family:sans-serif;">Preview unavailable</div></body></html>';
  }, [selected, livePreviewHtml, template.previewHtml]);

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
      {/* Real rendered preview */}
      <div className="template-card-preview-frame">
        {loadingPreview ? (
          <div className="template-card-loading">
            <div className="loading-pulse" />
          </div>
        ) : (
          <iframe
            className="template-card-iframe"
            srcDoc={displayHtml}
            title={`${template.title} preview`}
            sandbox=""
          />
        )}
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div className={`template-radio ${selected ? 'selected' : ''}`} />
        <span className="title-md">{template.title}</span>
      </div>
      <p className="text-muted text-sm">{template.description}</p>
    </div>
  );
}
