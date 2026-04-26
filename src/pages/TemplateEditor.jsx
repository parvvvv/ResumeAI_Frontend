import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  HiOutlineCode,
  HiOutlineEye,
  HiOutlinePlus,
  HiOutlineSave,
  HiOutlineTrash,
  HiOutlineShare,
  HiOutlineCloudUpload,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import api from '../api/client';
import { ActionBar, PageShell, SectionHeader, EmptyState } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { TEMPLATE_TAG_OPTIONS } from '../lib/templatePlatform';

/** Safely extract a displayable error string from an API error response. */
const extractError = (err, fallback = 'Something went wrong.') => {
  const detail = err?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (detail.message) return detail.message;
  return JSON.stringify(detail);
};

const defaultTemplate = {
  title: 'Untitled Template',
  description: '',
  visibility: 'private',
  status: 'draft',
  tags: ['developer'],
  htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{ resume.personalInfo.fullName or "Resume" }}</title>
  <style>
    body { font-family: Georgia, serif; padding: 28px; color: #111827; }
    h1 { margin-bottom: 8px; font-size: 28px; }
    .muted { color: #4b5563; font-size: 14px; margin-bottom: 18px; }
    .section { margin-top: 22px; }
    .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid #d1d5db; padding-bottom: 6px; }
    ul { padding-left: 18px; }
  </style>
</head>
<body>
  <h1>{{ resume.personalInfo.fullName }}</h1>
  <div class="muted">{{ resume.personalInfo.email }} | {{ resume.personalInfo.phone }}</div>
  <div class="section">
    <h2>Experience</h2>
    {% for exp in resume.workExperience %}
    <p><strong>{{ exp.role }}</strong> - {{ exp.company }}</p>
    <ul>
      {% for point in exp.points %}
      <li>{{ point }}</li>
      {% endfor %}
    </ul>
    {% endfor %}
  </div>
</body>
</html>`,
  templateSchema: {
    sections: ['personalInfo', 'workExperience', 'skills', 'projects', 'education'],
    fields: [],
  },
  previewSeedData: {
    resume: {
      personalInfo: {
        fullName: 'Avery Patel',
        email: 'avery.patel@example.com',
        phone: '+1 (555) 010-2244',
        linkedin: 'linkedin.com/in/averypatel',
        github: 'github.com/averypatel',
      },
      workExperience: [
        {
          company: 'Northstar Labs',
          role: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          startDate: '2022',
          endDate: 'Present',
          description: '',
          points: [
            'Led the template platform rollout with admin-only safety gating.',
            'Reduced PDF rendering regressions by moving system templates into seeded DB documents.',
          ],
          techStack: ['React', 'FastAPI', 'MongoDB'],
        },
      ],
      skills: [{ name: 'Core', items: ['React', 'FastAPI', 'MongoDB'] }],
      projects: [],
      education: [],
    },
    extras: {},
  },
};

function TemplatePreviewPane({ html }) {
  return (
    <div className="template-editor-preview-pane">
      <iframe className="template-editor-preview-frame" title="Template preview" srcDoc={html} sandbox="" />
    </div>
  );
}

export default function TemplateEditor() {
  const { templateId } = useParams();
  const isNew = templateId === 'new';
  const [form, setForm] = useState(defaultTemplate);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewWarnings, setPreviewWarnings] = useState([]);
  const [error, setError] = useState('');
  const [schemaText, setSchemaText] = useState(JSON.stringify(defaultTemplate.templateSchema, null, 2));
  const [previewSeedText, setPreviewSeedText] = useState(JSON.stringify(defaultTemplate.previewSeedData, null, 2));
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isNew) return;
    api.get(`/templates/${templateId}`)
      .then((res) => {
        const nextForm = {
          title: res.data.title,
          description: res.data.description,
          visibility: res.data.visibility,
          status: res.data.status,
          tags: res.data.tags || [],
          htmlContent: res.data.htmlContent,
          templateSchema: res.data.templateSchema,
          previewSeedData: res.data.previewSeedData,
        };
        setForm(nextForm);
        setSchemaText(JSON.stringify(nextForm.templateSchema, null, 2));
        setPreviewSeedText(JSON.stringify(nextForm.previewSeedData, null, 2));
        // Force an initial preview refresh once data is loaded
        refreshPreview();
      })
      .catch((err) => {
        setError(extractError(err, 'Failed to load template.'));
      })
      .finally(() => setLoading(false));
  }, [isNew, templateId]);

  // Debounced Live Preview
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) refreshPreview();
    }, 1000); // 1s debounce
    return () => clearTimeout(timer);
  }, [form.htmlContent, form.previewSeedData]);

  const updateJsonField = (field, text) => {
    if (field === 'templateSchema') setSchemaText(text);
    if (field === 'previewSeedData') setPreviewSeedText(text);
    try {
      const value = JSON.parse(text);
      setForm((current) => ({ ...current, [field]: value }));
      setError('');
    } catch {
      setError(`Invalid JSON in ${field}.`);
    }
  };

  const refreshPreview = async () => {
    // We check if we are already previewing to avoid spam
    setPreviewing(true);
    setError('');
    try {
      // Use the latest templateId from params
      const endpoint = (templateId === 'new') ? '/templates/preview' : `/templates/${templateId}/preview`;
      const res = await api.post(endpoint, {
        htmlContent: form.htmlContent,
        previewSeedData: form.previewSeedData,
      });
      setPreviewHtml(res.data.html);
      setPreviewWarnings(res.data.warnings || []);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setPreviewWarnings(detail?.warnings || []);
      setError(detail?.message || detail || 'Preview failed.');
    } finally {
      setPreviewing(false);
    }
  };

  const [jobState, setJobState] = useState(null);
  const [jobId, setJobId] = useState(null);

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
            } else {
              setJobState('failed');
              setError('Job completed but no template ID was returned.');
              setSaving(false);
            }
          } else if (status === 'failed') {
            setError(errorMessage || 'AI Generation failed. Please try again.');
            setSaving(false);
          } else {
            timeoutId = setTimeout(pollJobStatus, 3000);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setJobState('failed');
          setError(extractError(err, 'Failed to poll job status.'));
          setSaving(false);
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
  }, [jobId, jobState, navigate, addToast]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    if (isNew) {
      // Flow is AI-only for new templates
      const blob = new Blob([form.htmlContent], { type: 'text/html' });
      const formData = new FormData();
      formData.append('file', blob, 'template.html');

      try {
        const res = await api.post('/templates/generate/upload-html', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setJobId(res.data.jobId);
        setJobState(res.data.status || 'queued');
      } catch (err) {
        setJobState('failed');
        setError(extractError(err, 'Failed to initiate AI generation.'));
        setSaving(false);
      }
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.description,
        visibility: form.visibility,
        status: form.status,
        tags: form.tags,
        htmlContent: form.htmlContent,
        templateSchema: form.templateSchema,
        previewSeedData: form.previewSeedData,
      };
      await api.put(`/templates/${templateId}`, payload);
      addToast('Template saved.', 'success');
    } catch (err) {
      setError(extractError(err, 'Failed to save template.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) {
      navigate('/templates');
      return;
    }
    try {
      await api.delete(`/templates/${templateId}`);
      addToast('Template deleted.', 'success');
      navigate('/templates');
    } catch (err) {
      setError(extractError(err, 'Failed to delete template.'));
    }
  };

  const handlePublish = async () => {
    if (isNew) return;
    try {
      await api.post(`/templates/${templateId}/request-publish`);
      addToast('Template submitted for public review.', 'success');
      setForm((curr) => ({ ...curr, visibility: 'public', status: 'pending_review' }));
    } catch (err) {
      setError(extractError(err, 'Failed to request publishing.'));
    }
  };

  const handleShare = async () => {
    if (isNew) return;
    try {
      const res = await api.post(`/templates/${templateId}/share`, { 
        generateToken: true,
      });
      const shareToken = res.data.newToken;
      if (!shareToken) {
        addToast('Share token already exists. Check your template settings.', 'info');
        return;
      }
      const shareUrl = `${window.location.origin}/templates/share/${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      addToast('Share link copied to clipboard!', 'success');
    } catch (err) {
      setError(extractError(err, 'Failed to generate share link.'));
    }
  };

  if (isMobile) {
    return (
      <PageShell>
        <EmptyState
          icon={<HiOutlineDocumentText />}
          title="Desktop Required"
          description="The template editor requires a larger screen. Please open this page on a desktop computer to edit or preview templates."
        />
      </PageShell>
    );
  }

  if (loading) {
    return <div className="loading-overlay"><div className="loading-pulse" /><p>Loading template editor...</p></div>;
  }

  return (
    <PageShell className="template-editor-page" wide>
      <SectionHeader
        eyebrow={isNew ? 'AI Auto-Templatize' : 'Manual creator MVP'}
        title={isNew ? 'Create Template' : 'Edit Template'}
        description={isNew ? 'Paste raw HTML. The AI will automatically detect hardcoded data and replace it with Jinja tags.' : 'Work in draft mode, validate Jinja and preview seed data live, and keep template authoring separate from resume editing.'}
        actions={<Link to="/templates" className="btn btn-secondary" disabled={jobState === 'queued' || jobState === 'processing'}>Back to Templates</Link>}
      />

      {(jobState === 'queued' || jobState === 'processing' || jobState === 'uploading') && (
        <div className="alert alert-info mb-4 flex items-center gap-4">
          <div className="spinner" />
          <div>
            <strong>AI Generation in progress...</strong>
            <p>Please wait while the AI analyzes the HTML and inserts dynamic placeholders. This may take 15-30 seconds.</p>
          </div>
        </div>
      )}

      <ActionBar sticky className="template-editor-action-bar">
        {!isNew && (
          <>
            <button className="btn btn-secondary" onClick={handleShare}>
              <HiOutlineShare /> Share Link
            </button>
            {form.status !== 'published' && form.status !== 'pending_review' && (
              <button className="btn btn-secondary" onClick={handlePublish}>
                <HiOutlineCloudUpload /> Request Public
              </button>
            )}
          </>
        )}
        <button className="btn btn-secondary" onClick={refreshPreview} disabled={previewing || jobState === 'processing'}>
          <HiOutlineEye /> {previewing ? 'Refreshing…' : 'Refresh Preview'}
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || jobState === 'processing'}>
          <HiOutlineSave /> {saving ? 'Generating...' : (isNew ? 'Generate via AI' : 'Save Draft')}
        </button>
        <button className="btn btn-danger" onClick={handleDelete} disabled={jobState === 'processing'}>
          <HiOutlineTrash /> {isNew ? 'Discard' : 'Delete'}
        </button>
      </ActionBar>

      {error && <div className="admin-error">{error}</div>}

      <div className="template-editor-layout">
        <section className="template-editor-panel">
          <div className="template-editor-meta-grid">
            <div className="input-group">
              <label>Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Visibility</label>
              <select className="input" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="selective">Selective</option>
              </select>
            </div>
            <div className="input-group template-editor-meta-full">
              <label>Description</label>
              <textarea className="input template-editor-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          <div className="template-editor-tags">
            {TEMPLATE_TAG_OPTIONS.map((tag) => {
              const active = form.tags.includes(tag);
              return (
                <button
                  key={tag}
                  className={`template-platform-tag toggle ${active ? 'active' : ''}`}
                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      tags: active ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
                    }));
                  }}
                >
                  {active ? <HiOutlinePlus /> : null}
                  {tag}
                </button>
              );
            })}
          </div>

          <div className="template-editor-code-block">
            <div className="template-editor-heading"><HiOutlineCode /> HTML Template</div>
            <Editor
              height="420px"
              defaultLanguage="html"
              value={form.htmlContent}
              theme="vs-dark"
              onChange={(value) => setForm((current) => ({ ...current, htmlContent: value || '' }))}
              options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on' }}
            />
          </div>

          <div className="template-editor-json-grid">
            <div className="template-editor-code-block">
              <div className="template-editor-heading">Template Schema JSON</div>
              <Editor
                height="260px"
                defaultLanguage="json"
                value={schemaText}
                theme="vs-dark"
                onChange={(value) => updateJsonField('templateSchema', value || '{}')}
                options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on' }}
              />
            </div>
            <div className="template-editor-code-block">
              <div className="template-editor-heading">Preview Seed Data JSON</div>
              <Editor
                height="260px"
                defaultLanguage="json"
                value={previewSeedText}
                theme="vs-dark"
                onChange={(value) => updateJsonField('previewSeedData', value || '{}')}
                options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on' }}
              />
            </div>
          </div>
        </section>

        <aside className="template-editor-preview-column">
          <div className="template-editor-preview-header">
            <h2 className="title-md">Live Preview</h2>
            {previewWarnings.length > 0 && <span className="template-platform-status draft">Warnings: {previewWarnings.length}</span>}
          </div>
          {previewWarnings.length > 0 && (
            <div className="template-editor-warning-box">
              {previewWarnings.map((warning, index) => <div key={index}>{warning}</div>)}
            </div>
          )}
          <TemplatePreviewPane html={previewHtml} />
        </aside>
      </div>
    </PageShell>
  );
}
