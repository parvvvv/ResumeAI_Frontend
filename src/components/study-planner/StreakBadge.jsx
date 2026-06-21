import { useStudyPlan } from '../../context/StudyPlanContext';
import { HiFire } from 'react-icons/hi';

export default function StreakBadge() {
  const { streak } = useStudyPlan();

  if (streak == null) return null;

  return (
    <div className="streak-badge">
      <div className="streak-badge-inner">
        <div className={`streak-badge-flame ${streak > 0 ? 'active' : 'inactive'}`}>
          <HiFire size={22} />
          <div className="streak-badge-count">{streak}</div>
        </div>
        <div className="streak-badge-label">
          {streak > 0 ? 'Day Streak' : 'No Streak'}
        </div>
      </div>
    </div>
  );
}
