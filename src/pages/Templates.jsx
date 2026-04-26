import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineDuplicate,
  HiOutlineEye,
  HiOutlinePencilAlt,
  HiOutlinePlus,
} from 'react-icons/hi';
import api from '../api/client';
import { EmptyState, PageShell, ResponsiveCardList, SectionHeader } from '../components/ui';
import { useToast } from '../context/ToastContext';
import TemplateGenModal from '../components/TemplateGenModal';

const tabs = [
  { key: 'system', label: 'System' },
  { key: 'mine', label: 'My Templates' },
  { key: 'shared', label: 'Shared' },
  { key: 'public', label: 'Public', disabled: true, hidden: true },
];

function TemplatePreviewFrame({ html }) {
  return (
    <div className="template-platform-frame-shell">
      <iframe
        className="template-platform-frame"
        srcDoc={html}
        title="Template preview"
        sandbox=""
      />
    </div>
  );
}

function TemplateCard({ template, onDuplicate, onOpen }) {
  const previewHtml = useMemo(() => template.previewHtml || '', [template.previewHtml]);

  return (
    <article className="template-platform-card">
      <button className="template-platform-card-preview" onClick={onOpen}>
        <TemplatePreviewFrame html={previewHtml} />
      </button>
      <div className="template-platform-card-body">
        <div className="template-platform-card-header">
          <div>
            <h3 className="title-md">{template.title}</h3>
            <p className="text-muted text-sm">{template.description || 'No description yet.'}</p>
          </div>
          <span className={`template-platform-status ${template.status}`}>{template.status}</span>
        </div>
        <div className="template-platform-tags">
          {template.tags?.map((tag) => (
            <span key={tag} className="template-platform-tag">{tag}</span>
          ))}
        </div>
        <div className="template-platform-metrics">
          <span><HiOutlineEye /> {template.viewCount || 0}</span>
          <span><HiOutlineDocumentText /> {template.usageCount || 0}</span>
          <span>Fav {template.favoriteCount || 0}</span>
        </div>
        <div className="template-platform-actions">
          <button className="btn btn-sm btn-secondary" onClick={onOpen}>
            <HiOutlinePencilAlt /> Open
          </button>
          <button className="btn btn-sm btn-secondary" onClick={onDuplicate}>
            <HiOutlineDuplicate /> Duplicate
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Templates() {
  const [activeTab, setActiveTab] = useState('system');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/templates', { params: { filter: activeTab } });
      const list = await Promise.all((res.data || []).map(async (template) => {
        try {
          const previewRes = await api.post('/templates/preview', {
            htmlContent: template.htmlContent,
            previewSeedData: template.previewSeedData,
          });
          return { ...template, previewHtml: previewRes.data.html };
        } catch {
          return { ...template, previewHtml: '<html><body><div style="padding:24px;font-family:sans-serif;">Preview unavailable</div></body></html>' };
        }
      }));
      setTemplates(list);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError(err.response?.data?.detail || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const visibleTabs = tabs.filter((tab) => !tab.hidden);

  if (isMobile) {
    return (
      <PageShell>
        <EmptyState
          icon={<HiOutlineDocumentText />}
          title="Desktop Required"
          description="Template creation and previewing is a complex task that requires a larger screen. Please open this page on a desktop computer to build templates."
        />
      </PageShell>
    );
  }

  const handleDuplicate = async (templateId) => {
    try {
      await api.post(`/templates/${templateId}/duplicate`);
      addToast('Template duplicated into your drafts.', 'success');
      setActiveTab('mine');
      loadTemplates();
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to duplicate template.', 'error');
    }
  };

  return (
    <PageShell className="templates-page" wide>
      <SectionHeader
        title="Templates"
        description="Browse system templates, preview real layouts, and use AI to generate your own designs."
        actions={(
          <div className="templates-header-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={loadTemplates}>Refresh</button>
            <button className="btn btn-secondary" onClick={() => setAiModalOpen(true)}>
              <HiOutlinePlus /> Upload Image AI
            </button>
            <Link to="/templates/new" className="btn btn-primary">
              <HiOutlinePlus /> Create HTML Template
            </Link>
          </div>
        )}
      />

      <div className="template-platform-tabs" role="tablist" aria-label="Template categories">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            className={`template-platform-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => !tab.disabled && setActiveTab(tab.key)}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="loading-overlay"><div className="loading-pulse" /><p>Loading templates...</p></div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<HiOutlineDocumentText />}
          title="No templates here yet"
          description="System templates are seeded automatically. Manual drafts will show up here after you create them."
          action={<Link to="/templates/new" className="btn btn-primary"><HiOutlinePlus /> Create Draft</Link>}
        />
      ) : (
        <ResponsiveCardList className="template-platform-grid">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onOpen={() => navigate(`/templates/${template.id}`)}
              onDuplicate={() => handleDuplicate(template.id)}
            />
          ))}
        </ResponsiveCardList>
      )}

      <TemplateGenModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </PageShell>
  );
}
