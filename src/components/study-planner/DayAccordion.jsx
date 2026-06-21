import { useState } from 'react';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import SessionCard from './SessionCard';
import { useStudyPlan } from '../../context/StudyPlanContext';

export default function DayAccordion({ day, planId, weekNumber }) {
  const { currentDayInWeek, currentWeekNumber, activePlan } = useStudyPlan();
  
  // Auto-expand if it's the current day in the current week
  const isCurrentDay = weekNumber === currentWeekNumber && day.dayNumber === currentDayInWeek;
  const [isExpanded, setIsExpanded] = useState(isCurrentDay);
  
  // Calculate day progress
  const completedSessions = day.sessions.filter(s => activePlan?.progress?.[s.sessionId]).length;
  const totalSessions = day.sessions.length;
  const isAllComplete = totalSessions > 0 && completedSessions === totalSessions;

  return (
    <div className={`day-accordion ${isCurrentDay ? 'current' : ''} ${isAllComplete ? 'all-complete' : ''}`}>
      <button 
        className={`day-accordion-header ${isCurrentDay ? 'current-day' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`day-accordion-label ${isCurrentDay ? 'current' : ''}`}>
            Day {day.dayNumber}
            {isCurrentDay && <span className="day-accordion-today-badge">Today</span>}
          </div>
          <div className="day-accordion-stats">
            {completedSessions} / {totalSessions} completed • {day.totalMinutes}m
          </div>
        </div>
        <div className="day-accordion-chevron">
          {isExpanded ? <HiChevronUp size={20} /> : <HiChevronDown size={20} />}
        </div>
      </button>
      
      {isExpanded && (
        <div className="day-accordion-body">
          {day.sessions.map((session, idx) => (
            <SessionCard key={session.sessionId || idx} session={session} planId={planId} />
          ))}
        </div>
      )}
    </div>
  );
}
