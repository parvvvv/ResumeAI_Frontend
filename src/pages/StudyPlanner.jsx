import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStudyPlan } from '../context/StudyPlanContext';
import { HiOutlineLightBulb, HiOutlineFolder, HiOutlineAcademicCap } from 'react-icons/hi';
import { PageShell } from '../components/ui';
import PlanConfig from '../components/study-planner/PlanConfig';
import WeekTabs from '../components/study-planner/WeekTabs';
import DayAccordion from '../components/study-planner/DayAccordion';
import CareerGapCard from '../components/study-planner/CareerGapCard';
import PortfolioProjectCard from '../components/study-planner/PortfolioProjectCard';
import ResumeBulletsGenerator from '../components/study-planner/ResumeBulletsGenerator';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudyPlanner() {
  const { 
    plans, 
    archivedPlans, 
    activePlan, 
    loading, 
    fetchPlan, 
    archivePlan,
    restorePlan,
    regenerateWeek
  } = useStudyPlan();
  
  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('active');
  const [activeWeek, setActiveWeek] = useState(1);
  const [fetchError, setFetchError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'archive' | 'regenerate', label: string }
  const [isRegenerating, setIsRegenerating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('resumeId')) {
      setViewMode('create');
    } else if (plans.length > 0 && !activePlan && viewMode !== 'create') {
      fetchPlan(plans[0].id).then(() => setViewMode('view')).catch(() => setFetchError('Failed to load plan'));
    }
  }, [location.search, plans, activePlan, fetchPlan, viewMode]);

  const handleCreateNew = () => setViewMode('create');
  
  const handleViewPlan = async (id) => {
    setFetchError(null);
    try {
      await fetchPlan(id);
      setViewMode('view');
    } catch {
      setFetchError('Failed to load plan details');
    }
  };

  const handleArchive = () => {
    setConfirmAction({ type: 'archive', label: 'Archive this plan? You can restore it later.' });
  };

  const handleRegenerate = () => {
    setConfirmAction({ type: 'regenerate', label: `Regenerate Week ${activeWeek}? This will reset all progress for this week.` });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'archive') {
      await archivePlan(activePlan.id);
      setViewMode('list');
    } else if (confirmAction.type === 'regenerate') {
      setIsRegenerating(true);
      try {
        await regenerateWeek(activePlan.id, activeWeek);
      } finally {
        setIsRegenerating(false);
      }
    }
    setConfirmAction(null);
  };

  // Resolve current week data — always use array index since backend now sets correct weekNumber
  const weeklyPlan = activePlan?.plan?.weeklyPlan;
  const currentWeekData = weeklyPlan?.[activeWeek - 1];

  let completedTaskCount = 0;
  let totalTaskCount = 0;
  if (currentWeekData && activePlan) {
    (currentWeekData.days || []).forEach(day => {
      (day.sessions || []).forEach(session => {
        totalTaskCount++;
        if (activePlan.progress?.[session.sessionId]) {
          completedTaskCount++;
        }
      });
    });
  }

  return (
    <PageShell className="study-planner-page">
      <header className="page-header">
        <div className="page-title">
          <h1>Study Planner</h1>
          <p>Level up your skills with a personalized, project-based curriculum.</p>
        </div>
        {viewMode === 'view' && (
          <button className="btn btn-outline" onClick={() => setViewMode('list')}>
            ← Back to Plans
          </button>
        )}
      </header>

      {fetchError && (
        <div style={{ color: 'var(--error)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)', background: 'rgb(var(--error) / 0.08)', borderRadius: 'var(--radius-md)' }}>
          {fetchError}
        </div>
      )}

      {loading && !activePlan && viewMode === 'list' && (
        <div className="loading-state">Loading your plans...</div>
      )}

      {viewMode === 'list' && !loading && (
        <div className="plan-list-view">
          <div className="plan-list-header">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active Plans ({plans.length})
              </button>
              <button 
                className={`tab ${activeTab === 'archived' ? 'active' : ''}`}
                onClick={() => setActiveTab('archived')}
              >
                Archived ({archivedPlans.length})
              </button>
            </div>
            {activeTab === 'active' && (
              <button className="btn btn-primary" onClick={handleCreateNew}>
                + New Plan
              </button>
            )}
          </div>

          <div className="plan-grid">
            {activeTab === 'active' && plans.map(plan => (
              <div key={plan.id} className="plan-card" onClick={() => handleViewPlan(plan.id)}>
                <h3>{plan.plan?.projectArc?.name || 'Study Plan'}</h3>
                <p className="role-target">Target: {plan.plan?.metadata?.targetRole || 'Software Engineer'}</p>
                <div className="plan-meta">
                  <span><HiOutlineAcademicCap /> {plan.config?.totalWeeks || '?'} Weeks</span>
                  <span><HiOutlineLightBulb /> {plan.metrics?.completionPercent || 0}% Complete</span>
                </div>
                <div className="progress-bar-bg mt-2">
                  <div className="progress-bar-fill" style={{ width: `${plan.metrics?.completionPercent || 0}%` }} />
                </div>
              </div>
            ))}
            
            {activeTab === 'active' && plans.length === 0 && (
              <div className="empty-state">
                <HiOutlineFolder className="empty-icon" />
                <p>No active study plans.</p>
                <button className="btn btn-primary mt-4" onClick={handleCreateNew}>Create Your First Plan</button>
              </div>
            )}

            {activeTab === 'archived' && archivedPlans.map(plan => (
              <div key={plan.id} className="plan-card archived">
                <div className="flex justify-between">
                  <h3>{plan.plan?.projectArc?.name || 'Study Plan'}</h3>
                  <button className="btn btn-outline btn-sm" onClick={() => restorePlan(plan.id)}>Restore</button>
                </div>
                <p className="role-target">Target: {plan.plan?.metadata?.targetRole || 'Software Engineer'}</p>
              </div>
            ))}
            
            {activeTab === 'archived' && archivedPlans.length === 0 && (
              <div className="empty-state">
                <p>No archived plans.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'create' && (
        <PlanConfig onPlanCreated={(id) => handleViewPlan(id)} onCancel={() => setViewMode('list')} />
      )}

      {viewMode === 'view' && activePlan && (
        <div className="plan-detail-view">
          <div className="plan-hero">
            <div className="plan-hero-content">
              <h2>{activePlan.plan?.projectArc?.name || 'Study Plan'}</h2>
              <p>{activePlan.plan?.projectArc?.description || ''}</p>
              
              <div className="plan-hero-stats">
                <div className="stat-pill">
                  <span className="label">Overall Progress</span>
                  <span className="value">{activePlan.metrics?.completionPercent || 0}%</span>
                </div>
                <div className="stat-pill">
                  <span className="label">Readiness Score</span>
                  <span className="value">{activePlan.plan?.careerGapAnalysis?.readinessScore || 0}/100</span>
                </div>
              </div>
            </div>
            <div className="plan-hero-actions">
              <button className="btn btn-outline text-error" onClick={handleArchive}>
                Archive Plan
              </button>
            </div>
          </div>

          <CareerGapCard gapAnalysis={activePlan.plan?.careerGapAnalysis} />

          <div className="plan-weeks-section">
            <WeekTabs 
              weeks={activePlan.plan?.weeklyPlan} 
              activeWeek={activeWeek} 
              onSelect={setActiveWeek}
              progress={activePlan.progress}
            />

            <AnimatePresence mode="wait">
              {currentWeekData && (
                <motion.div 
                  key={activeWeek}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="week-content"
                >
                  <PortfolioProjectCard project={currentWeekData.portfolioProject} />
                  
                  <div className="days-list">
                    {(currentWeekData.days || []).map((day, idx) => (
                      <DayAccordion key={day.dayNumber || idx} day={day} planId={activePlan.id} weekNumber={activeWeek} />
                    ))}
                  </div>

                  <ResumeBulletsGenerator 
                    weekNumber={activeWeek} 
                    completedTaskCount={completedTaskCount}
                    totalTaskCount={totalTaskCount}
                  />

                  <div className="week-nav-buttons">
                    <button
                      className="week-nav-btn"
                      disabled={activeWeek <= 1}
                      onClick={() => setActiveWeek(activeWeek - 1)}
                    >
                      ← Week {activeWeek - 1}
                    </button>
                    <button
                      className="week-nav-btn week-nav-regen"
                      disabled={isRegenerating}
                      onClick={handleRegenerate}
                    >
                      {isRegenerating ? 'Regenerating...' : 'Regenerate Week'}
                    </button>
                    <button
                      className="week-nav-btn"
                      disabled={activeWeek >= (weeklyPlan?.length || 1)}
                      onClick={() => setActiveWeek(activeWeek + 1)}
                    >
                      Week {activeWeek + 1} →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <p style={{ marginBottom: 'var(--space-6)', fontSize: '0.95rem' }}>{confirmAction.label}</p>
            <div className="flex justify-end gap-3">
              <button className="btn btn-outline" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button
                className={`btn ${confirmAction.type === 'archive' ? 'btn-outline text-error' : 'btn-primary'}`}
                onClick={executeConfirmedAction}
              >
                {confirmAction.type === 'archive' ? 'Archive' : 'Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
