import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUpload, HiOutlinePencilAlt, HiOutlineSparkles,
  HiOutlineDocumentText, HiOutlineDownload, HiOutlineEye,
  HiOutlineDocumentAdd, HiOutlineTrash,
} from 'react-icons/hi';
import { useToast } from '../context/ToastContext';
import { useResumes } from '../context/ResumeContext';
import { useSearch } from '../context/SearchContext';
import { useNotificationEvents } from '../context/NotificationContext';
import { EmptyState, PageShell, SectionHeader } from '../components/ui';
import {
  ProcessingCard, AnalyticsStrip, OverflowMenu, ConfirmModal,
} from '../components/resume/ResumeBits';

const matchesQuery = (resumeData, query) => {
  const name = resumeData?.personalInfo?.fullName || '';
  if (name.toLowerCase().includes(query)) return true;
  const workExp = resumeData?.workExperience || [];
  for (const exp of workExp) {
    if (exp.role?.toLowerCase().includes(query)) return true;
    if (exp.company?.toLowerCase().includes(query)) return true;
  }
  const skills = resumeData?.skills || [];
  if (Array.isArray(skills)) {
    for (const cat of skills) {
      if (Array.isArray(cat.items) && cat.items.some((s) => s.toLowerCase().includes(query))) return true;
    }
  }
  return false;
};

export default function Resumes() {
  const {
    baseResumes, generatedResumes: generated, loading: contextLoading,
    hasInitialFetch, deleteBase, deleteGenerated, fetchResumes,
  } = useResumes();
  const { processingJobs } = useNotificationEvents();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { searchQuery, setSearchQuery } = useSearch();

  const [deleting, setDeleting] = useState(null);
  const [selectedBaseId, setSelectedBaseId] = useState(null);
  const [view, setView] = useState('all'); // all | originals | tailored
  const [tailoredSort, setTailoredSort] = useState('newest'); // newest | ats
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  useEffect(() => { fetchResumes(true); }, [fetchResumes]);

  const loading = contextLoading && (!hasInitialFetch || (baseResumes.length === 0 && generated.length === 0));
  const closeModal = () => setConfirmModal({ open: false, title: '', message: '', onConfirm: null });

  const handleDeleteBase = (id) => setConfirmModal({
    open: true,
    title: 'Delete Original Resume',
    message: 'Are you sure? This will delete the original resume. Any tailored versions will remain, but their connection to this original will be lost. This action cannot be undone.',
    onConfirm: async () => {
      setDeleting(id);
      try {
        await deleteBase(id);
        if (selectedBaseId === id) setSelectedBaseId(null);
        addToast('Original resume deleted.', 'success');
      } catch (err) {
        console.error('Failed to delete resume:', err);
        addToast('Failed to delete resume.', 'error');
      } finally { setDeleting(null); closeModal(); }
    },
  });

  const handleDeleteGenerated = (id) => setConfirmModal({
    open: true,
    title: 'Delete Tailored Resume',
    message: 'Are you sure you want to delete this tailored resume? This action cannot be undone.',
    onConfirm: async () => {
      setDeleting(id);
      try {
        await deleteGenerated(id);
        addToast('Tailored resume deleted.', 'success');
      } catch (err) {
        console.error('Failed to delete resume:', err);
        addToast('Failed to delete resume.', 'error');
      } finally { setDeleting(null); closeModal(); }
    },
  });

  if (loading) {
    return <div className="loading-overlay"><div className="loading-pulse" /><p>Loading your resumes...</p></div>;
  }

  const query = searchQuery.toLowerCase().trim();

  const filteredBase = baseResumes.filter((r) => !query || matchesQuery(r.resumeData, query));

  const filteredGenerated = generated.filter((r) => {
    if (selectedBaseId && r.baseResumeId !== selectedBaseId) return false;
    if (!query) return true;
    const base = baseResumes.find((b) => b.id === r.baseResumeId);
    if (r.summary?.toLowerCase().includes(query)) return true;
    if (base && matchesQuery(base.resumeData, query)) return true;
    if (r.analytics?.matchedKeywords?.some((kw) => kw.toLowerCase().includes(query))) return true;
    return false;
  });

  filteredGenerated.sort((a, b) => (
    tailoredSort === 'ats'
      ? (b.analytics?.atsScore || 0) - (a.analytics?.atsScore || 0)
      : new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  ));

  const baseName = (id) => baseResumes.find((b) => b.id === id)?.resumeData?.personalInfo?.fullName || 'Base Resume';
  const versionCount = (id) => generated.filter((g) => g.baseResumeId === id).length;
  const activeProcessingEntries = Object.entries(processingJobs);
  const hasContent = baseResumes.length > 0 || generated.length > 0;

  // Tapping an original drills into its tailored versions (master → detail).
  const openVersions = (id) => {
    setSelectedBaseId(id);
    setView('tailored');
  };
  const resetFilters = () => {
    setSelectedBaseId(null);
    setSearchQuery('');
    setView('all');
  };

  const showOriginals = view !== 'tailored';
  const showTailored = view !== 'originals';

  const views = [
    { id: 'all', label: 'All' },
    { id: 'originals', label: `Originals (${baseResumes.length})` },
    { id: 'tailored', label: `Tailored (${generated.length})` },
  ];

  return (
    <PageShell className="resumes-page" wide>
      <SectionHeader
        eyebrow="Library"
        title="Resumes"
        description="Your original resumes and every tailored version, in one place."
        icon={<HiOutlineDocumentText />}
        actions={(
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            <HiOutlineUpload size={18} /> Upload Resume
          </button>
        )}
        className="mb-8"
      />

      {!hasContent ? (
        <EmptyState
          icon={<HiOutlineDocumentAdd size={64} />}
          title="No resumes yet"
          description="Upload your first resume and start tailoring it for the jobs you want."
          action={(
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/upload')}>
              <HiOutlineUpload size={18} /> Upload Your First Resume
            </button>
          )}
        />
      ) : (
        <>
          <div className="library-toolbar">
            <div className="segmented" role="tablist">
              {views.map((v) => (
                <button
                  key={v.id}
                  role="tab"
                  aria-selected={view === v.id}
                  className={`segmented-item ${view === v.id ? 'active' : ''}`}
                  onClick={() => setView(v.id)}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="library-toolbar-right">
              {showTailored && generated.length > 1 && (
                <label className="jobs-sort">
                  <span>Sort</span>
                  <select className="jobs-sort-select" value={tailoredSort} onChange={(e) => setTailoredSort(e.target.value)}>
                    <option value="newest">Newest</option>
                    <option value="ats">Highest ATS</option>
                  </select>
                </label>
              )}
              {(selectedBaseId || searchQuery) && (
                <button className="btn btn-sm btn-secondary" onClick={resetFilters}>
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Context banner when drilled into one original's versions */}
          {selectedBaseId && (
            <div className="library-filter-banner">
              <span>
                Showing versions tailored from <strong>{baseName(selectedBaseId)}</strong>
              </span>
              <button className="link-btn" onClick={resetFilters}>Show all</button>
            </div>
          )}

          {/* Active tailoring jobs */}
          {activeProcessingEntries.map(([baseResumeId, job]) => (
            <ProcessingCard key={baseResumeId} baseResumeId={baseResumeId} job={job} baseResumes={baseResumes} />
          ))}

          {/* Originals */}
          {showOriginals && (
            <section className="library-section">
              <h2 className="dash-section-title">Originals</h2>
              {filteredBase.length > 0 ? (
                <div className="resume-grid">
                  {filteredBase.map((r) => {
                    const count = versionCount(r.id);
                    return (
                      <div
                        key={r.id}
                        className="resume-card original"
                        role="button"
                        tabIndex={0}
                        onClick={() => openVersions(r.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') openVersions(r.id); }}
                      >
                        <div className="resume-card-head">
                          <div className="resume-card-titles">
                            <span className="resume-card-title truncate">{r.resumeData?.personalInfo?.fullName || 'Untitled Resume'}</span>
                            <span className="resume-card-sub truncate">
                              {r.resumeData?.workExperience?.[0]?.role || r.resumeData?.personalInfo?.email || 'No role listed'}
                            </span>
                          </div>
                          <OverflowMenu items={[
                            { icon: <HiOutlineDocumentText />, label: 'Generate PDF', onClick: () => navigate(`/preview/${r.id}?type=base`) },
                            { icon: <HiOutlineTrash />, label: deleting === r.id ? 'Deleting...' : 'Delete', onClick: () => handleDeleteBase(r.id), danger: true, disabled: deleting === r.id },
                          ]} />
                        </div>
                        <div className="resume-card-foot">
                          <span className={`resume-version-badge ${count ? '' : 'empty'}`}>
                            {count > 0 ? `${count} tailored ${count === 1 ? 'version' : 'versions'}` : 'No versions yet'}
                          </span>
                        </div>
                        <div className="resume-card-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/editor/${r.id}`)}>
                            <HiOutlinePencilAlt /> Edit
                          </button>
                          <button className="btn btn-sm btn-primary" onClick={() => navigate(`/tailor/${r.id}`)}>
                            <HiOutlineSparkles /> Tailor
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted text-sm">{baseResumes.length === 0 ? 'No original resumes.' : 'No matches found.'}</p>
              )}
            </section>
          )}

          {/* Tailored */}
          {showTailored && (
            <section className="library-section">
              <h2 className="dash-section-title">
                Tailored
                {selectedBaseId && <span className="text-muted"> · from {baseName(selectedBaseId)}</span>}
              </h2>
              {filteredGenerated.length > 0 ? (
                <div className="resume-grid tailored">
                  {filteredGenerated.map((r) => (
                    <div key={r.id} className={`glass resume-card tailored ${!r.pdfUrl ? 'pulse-glow' : ''}`}>
                      <div className="resume-card-head">
                        <div className="resume-card-titles">
                          <div className="resume-card-title-row">
                            <span className="resume-card-title truncate">{r.summary || 'Tailored Resume'}</span>
                            <span className={`resume-status ${r.pdfUrl ? 'ready' : 'draft'}`}>
                              {r.pdfUrl ? 'PDF ready' : 'Draft'}
                            </span>
                          </div>
                          <span className="resume-card-sub truncate">
                            ↳ {baseName(r.baseResumeId)}
                            {r.createdAt && <> · {new Date(r.createdAt).toLocaleDateString()}</>}
                          </span>
                        </div>
                        <OverflowMenu items={[
                          { icon: <HiOutlineEye />, label: 'Preview', onClick: () => navigate(`/preview/${r.id}?type=generated`) },
                          ...(r.pdfUrl ? [{ icon: <HiOutlineDownload />, label: 'Download', onClick: () => window.open(r.pdfUrl, '_blank') }] : []),
                          { icon: <HiOutlineTrash />, label: deleting === r.id ? 'Deleting…' : 'Delete', onClick: () => handleDeleteGenerated(r.id), danger: true, disabled: deleting === r.id },
                        ]} />
                      </div>

                      {r.analytics?.atsScore > 0 && (
                        <div className="ats-bar" title={`ATS score ${r.analytics.atsScore}%`}>
                          <div className="ats-bar-head">
                            <span>ATS score</span>
                            <span className="ats-bar-pct">{r.analytics.atsScore}%</span>
                          </div>
                          <div className="ats-bar-track">
                            <div
                              className="ats-bar-fill"
                              data-band={r.analytics.atsScore >= 75 ? 'good' : r.analytics.atsScore >= 50 ? 'mid' : 'low'}
                              style={{ width: `${r.analytics.atsScore}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="resume-card-analytics">
                        <AnalyticsStrip analytics={r.analytics} />
                      </div>

                      <div className="resume-card-actions end">
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/preview/${r.id}?type=generated`)}>
                          <HiOutlineEye /> Preview
                        </button>
                        {r.pdfUrl && (
                          <a href={r.pdfUrl} download className="btn btn-sm btn-primary">
                            <HiOutlineDownload /> Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : generated.length === 0 ? (
                <div className="library-empty">
                  <span className="library-empty-icon"><HiOutlineSparkles size={26} /></span>
                  <div>
                    <p className="library-empty-title">No tailored versions yet</p>
                    <p className="text-muted text-sm">Tailor an original resume to a job description to create your first ATS-optimized version.</p>
                  </div>
                  {(selectedBaseId || baseResumes[0]?.id) && (
                    <button className="btn btn-sm btn-primary" onClick={() => navigate(`/tailor/${selectedBaseId || baseResumes[0].id}`)}>
                      <HiOutlineSparkles /> Tailor a resume
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-muted text-sm">No tailored resumes match your filters.</p>
              )}
            </section>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeModal}
        isLoading={!!deleting}
      />
    </PageShell>
  );
}
