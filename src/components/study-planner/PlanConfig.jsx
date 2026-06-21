import { useState } from 'react';
import { useStudyPlan } from '../../context/StudyPlanContext';
import { useResumes } from '../../context/ResumeContext';
import { HiOutlineDocumentText, HiOutlineBriefcase } from 'react-icons/hi';
import PlanGenArtifact from './PlanGenArtifact';

export default function PlanConfig({ onPlanCreated, onCancel }) {
  const { generatePlan, isGenerating, generationMessage } = useStudyPlan();
  const { generatedResumes } = useResumes();
  
  const [sourceType, setSourceType] = useState('resume');
  const [resumeId, setResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState(null);
  
  const [config, setConfig] = useState({
    totalWeeks: 3,
    hoursPerDay: 2,
    daysPerWeek: 5,
    focusAreas: ['technical-skills', 'system-design', 'dsa-coding']
  });

  const availableAreas = [
    { id: 'technical-skills', label: 'Tech Skills' },
    { id: 'system-design', label: 'System Design' },
    { id: 'dsa-coding', label: 'Algorithms' },
    { id: 'behavioral', label: 'Behavioral' },
    { id: 'domain-knowledge', label: 'Domain' },
    { id: 'projects', label: 'Projects' }
  ];

  const handleFocusToggle = (id) => {
    setConfig(prev => {
      const exists = prev.focusAreas.includes(id);
      if (exists) return { ...prev, focusAreas: prev.focusAreas.filter(a => a !== id) };
      return { ...prev, focusAreas: [...prev.focusAreas, id] };
    });
  };

  const handleGenerate = async () => {
    setError(null);
    if (sourceType === 'resume' && !resumeId) {
      setError('Please select a resume');
      return;
    }
    if (sourceType === 'jd' && !jobDescription) {
      setError('Please enter a Job Description');
      return;
    }
    
    const request = {
      ...config,
      generatedResumeId: sourceType === 'resume' ? resumeId : null,
      jobDescription: sourceType === 'jd' ? jobDescription : null
    };

    try {
      const planId = await generatePlan(request);
      if (planId) onPlanCreated(planId);
    } catch (e) {
      setError(e.message || 'Failed to generate plan');
    }
  };

  if (isGenerating) {
    return (
      <PlanGenArtifact message={generationMessage} />
    );
  }

  return (
    <div className="plan-config-card">
      <h2 className="text-2xl font-bold mb-6">Create Study Plan</h2>
      
      {error && (
        <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'rgb(var(--error) / 0.08)', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      <div className="config-section mb-6">
        <h3 className="text-lg font-medium mb-3">1. Target Role Source</h3>
        <div className="flex gap-4 mb-4">
          <button 
            className={`config-source-btn ${sourceType === 'resume' ? 'active' : ''}`}
            onClick={() => { setSourceType('resume'); setError(null); }}
          >
            <HiOutlineDocumentText /> Target Resume
          </button>
          <button 
            className={`config-source-btn ${sourceType === 'jd' ? 'active' : ''}`}
            onClick={() => { setSourceType('jd'); setError(null); }}
          >
            <HiOutlineBriefcase /> Custom Job Description
          </button>
        </div>
        
        {sourceType === 'resume' ? (
          <select 
            className="input w-full"
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
          >
            <option value="">-- Select a tailored resume --</option>
            {generatedResumes.map(r => (
              <option key={r.id} value={r.id}>{r.summary || 'Tailored Resume'}</option>
            ))}
          </select>
        ) : (
          <textarea 
            className="input w-full"
            style={{ height: '8rem' }}
            placeholder="Paste job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        )}
      </div>

      <div className="config-section mb-6">
        <h3 className="text-lg font-medium mb-3">2. Time Commitment</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
              Duration: {config.totalWeeks} Weeks
            </label>
            <input 
              type="range" min="1" max="5" 
              value={config.totalWeeks} 
              onChange={e => setConfig({...config, totalWeeks: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
              Study Days: {config.daysPerWeek} days/week
            </label>
            <input 
              type="range" min="1" max="7" 
              value={config.daysPerWeek} 
              onChange={e => setConfig({...config, daysPerWeek: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>
          <div className="col-span-2">
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
              Daily Hours: {config.hoursPerDay} hrs
            </label>
            <input 
              type="range" min="0.5" max="8" step="0.5"
              value={config.hoursPerDay} 
              onChange={e => setConfig({...config, hoursPerDay: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="config-section mb-8">
        <h3 className="text-lg font-medium mb-3">3. Focus Areas</h3>
        <div className="flex flex-wrap gap-2">
          {availableAreas.map(area => {
            const isActive = config.focusAreas.includes(area.id);
            return (
              <button
                key={area.id}
                className={`focus-chip ${isActive ? 'active' : ''}`}
                onClick={() => handleFocusToggle(area.id)}
              >
                {area.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleGenerate}>
          Generate Personalized Plan
        </button>
      </div>
    </div>
  );
}
