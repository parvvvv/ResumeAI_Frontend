import { HiOutlineAcademicCap, HiOutlineLightningBolt, HiOutlineClipboardCheck, HiOutlineChartBar, HiOutlineCube } from 'react-icons/hi';

const phases = [
  { icon: HiOutlineClipboardCheck, label: 'Analyzing Resume', key: 'analyzing' },
  { icon: HiOutlineChartBar, label: 'Mapping Skill Gaps', key: 'mapping' },
  { icon: HiOutlineCube, label: 'Building Curriculum', key: 'building' },
  { icon: HiOutlineLightningBolt, label: 'Generating Weeks', key: 'generating' },
];

export default function PlanGenArtifact({ message = '' }) {
  const phaseIndex = phases.findIndex(p => message.toLowerCase().includes(p.key)) + 1;
  const currentPhase = Math.max(0, Math.min(phaseIndex, phases.length - 1));

  return (
    <div className="plan-artifact">
      <div className="plan-artifact-scene">
        <div className="plan-artifact-card">
          <div className="plan-artifact-face plan-artifact-front">
            <div className="plan-artifact-glow" />
            <div className="plan-artifact-icon-row">
              <HiOutlineAcademicCap size={32} />
            </div>
            <h3 className="plan-artifact-title">Crafting Your Plan</h3>
            <div className="plan-artifact-progress">
              <div className="plan-artifact-phase-label">{phases[currentPhase].label}</div>
              <div className="plan-artifact-bar-bg">
                <div
                  className="plan-artifact-bar-fill"
                  style={{ width: `${((currentPhase + 1) / phases.length) * 100}%` }}
                />
              </div>
              <div className="plan-artifact-phase-dots">
                {phases.map((p, i) => (
                  <div
                    key={p.key}
                    className={`plan-artifact-dot ${i <= currentPhase ? 'done' : ''} ${i === currentPhase ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
            <p className="plan-artifact-message">{message || 'Initializing...'}</p>
          </div>
          <div className="plan-artifact-face plan-artifact-back">
            <div className="plan-artifact-icon-row">
              <HiOutlineLightningBolt size={32} />
            </div>
            <h3 className="plan-artifact-title">AI Engine Active</h3>
            <p className="plan-artifact-sub">Generating personalized curriculum</p>
            <div className="plan-artifact-pulse-ring" />
          </div>
        </div>
      </div>
    </div>
  );
}