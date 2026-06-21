import { useStudyPlan } from '../../context/StudyPlanContext';
import { HiCheckCircle, HiOutlineClock, HiOutlineLink, HiOutlineCode } from 'react-icons/hi';

export default function SessionCard({ session, planId }) {
  const { activePlan, toggleSession } = useStudyPlan();
  const isCompleted = activePlan?.progress?.[session.sessionId] || false;

  const handleToggle = (e) => {
    e.stopPropagation();
    toggleSession(planId, session.sessionId, !isCompleted);
  };

  return (
    <div className={`session-card ${isCompleted ? 'completed' : ''}`}>
      <div className="session-card-body">
        <button 
          className={`session-card-checkbox ${isCompleted ? 'checked' : ''}`}
          onClick={handleToggle}
        >
          <HiCheckCircle size={24} />
        </button>
        
        <div className="session-card-content">
          <div className="flex justify-between items-start mb-1">
            <h4 className={`session-card-title ${isCompleted ? 'completed' : ''}`}>
              {session.title}
            </h4>
            <span className="session-card-duration">
              <HiOutlineClock /> {session.durationMinutes}m
            </span>
          </div>
          
          <p className="session-card-desc">{session.description}</p>
          
          {session.rationale && (
            <div className="session-card-rationale">
              <strong>Why: </strong>{session.rationale}
            </div>
          )}
          
          <div className="session-card-detail-grid">
            {session.practiceTask && (
              <div className="session-card-detail-box">
                <strong><HiOutlineCode /> Practice Task</strong>
                <span>{session.practiceTask}</span>
              </div>
            )}
            
            {session.resources?.length > 0 && (
              <div className="session-card-detail-box">
                <strong><HiOutlineLink /> Resources</strong>
                <ul className="list-disc pl-4 text-secondary">
                  {session.resources.map((r, i) => (
                    <li key={`${r.title}-${i}`}>
                      <span className="font-medium">{r.title}</span> 
                      <div className="text-xs opacity-75" style={{ wordBreak: 'break-word' }}>Search: "{r.searchQuery}"</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {session.projectContribution && (
            <div className="session-card-project-contribution">
              <strong>Project Contribution: </strong>{session.projectContribution}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
