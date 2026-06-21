import { Link } from 'react-router-dom';
import { useStudyPlan } from '../../context/StudyPlanContext';
import { HiOutlineAcademicCap, HiCheckCircle, HiArrowRight } from 'react-icons/hi';

export default function StudyDashboardWidget() {
  const { activePlan, todaysTasks, leftoverTasks, currentRelativeDay, currentWeekNumber, dailyQuote, toggleSession } = useStudyPlan();

  if (!activePlan) {
    return (
      <div className="dash-widget">
        <div className="dash-widget-header">
          <div className="dash-widget-icon default">
            <HiOutlineAcademicCap size={24} />
          </div>
          <h2 className="dash-widget-title">Study Planner</h2>
        </div>
        <p className="dash-widget-desc">You don't have an active study plan. Create one to get personalized, project-based interview prep.</p>
        <Link to="/study-planner" className="btn btn-outline text-sm">Create Plan</Link>
      </div>
    );
  }

  const handleToggle = (sessionId, completed) => {
    toggleSession(activePlan.id, sessionId, !completed);
  };

  if (leftoverTasks.length > 0) {
    const firstLeftover = leftoverTasks[0];
    return (
      <div className="dash-widget warning">
        <div className="dash-widget-header">
          <div className="dash-widget-icon warning">
            <HiOutlineAcademicCap size={24} />
          </div>
          <h2 className="dash-widget-title warning">Catch Up: {firstLeftover.weekLabel} - {firstLeftover.dayLabel}</h2>
        </div>
        <p className="dash-widget-desc">You have unfinished tasks from previous days. Catching up keeps your streak alive!</p>
        
        <div className="dash-widget-tasks">
          {firstLeftover.sessions.slice(0, 2).map((session, i) => (
            <div key={i} className="dash-widget-task warning">
              <button onClick={() => handleToggle(session.sessionId, true)} className="dash-widget-task-checkbox" style={{ color: 'rgb(var(--warning) / 0.5)' }}>
                <HiCheckCircle size={20} />
              </button>
              <span className="dash-widget-task-label">{session.title}</span>
            </div>
          ))}
          {firstLeftover.sessions.length > 2 && (
            <div className="text-xs text-center" style={{ color: 'rgb(var(--warning) / 0.6)' }}>+{firstLeftover.sessions.length - 2} more</div>
          )}
        </div>
        
        <Link to="/study-planner" className="btn btn-primary w-full justify-center">Go to Planner</Link>
      </div>
    );
  }

  const uncompletedToday = todaysTasks.filter(t => !t.completed);
  if (uncompletedToday.length > 0) {
    return (
      <div className="dash-widget">
        <div className="dash-widget-header">
          <div className="dash-widget-icon default">
            <HiOutlineAcademicCap size={24} />
          </div>
          <h2 className="dash-widget-title">Today's Study Plan (Week {currentWeekNumber})</h2>
        </div>
        
        <div className="dash-widget-tasks">
          {uncompletedToday.slice(0, 3).map((session, i) => (
            <div key={i} className="dash-widget-task">
              <button onClick={() => handleToggle(session.sessionId, false)} className="dash-widget-task-checkbox">
                <HiCheckCircle size={20} />
              </button>
              <div>
                <div className="dash-widget-task-label">{session.title}</div>
                <div className="text-xs text-secondary line-clamp-1">{session.practiceTask}</div>
              </div>
            </div>
          ))}
        </div>
        
        <Link to="/study-planner" className="dash-widget-link">
          Open Full Planner <HiArrowRight />
        </Link>
      </div>
    );
  }

  const tomorrowDay = currentRelativeDay + 1;
  return (
    <div className="dash-widget success">
      <div className="dash-widget-success-icon">
        <HiCheckCircle size={32} />
      </div>
      <h2 className="dash-widget-title success">All done for today!</h2>
      <p className="dash-widget-quote">"{dailyQuote}"</p>
      <p className="dash-widget-tomorrow">Tomorrow: Day {tomorrowDay} — keep the streak going!</p>
      <Link to="/study-planner" className="btn btn-outline btn-sm">Review Plan</Link>
    </div>
  );
}
