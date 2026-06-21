export default function WeekTabs({ weeks, activeWeek, onSelect, progress }) {
  if (!weeks || weeks.length === 0) return null;

  // If weekNumbers aren't unique (old plans with LLM bug), use array index
  const hasUniqueNumbers = new Set(weeks.map(w => w.weekNumber)).size === weeks.length;

  const getDisplayNum = (w, i) => (hasUniqueNumbers ? w.weekNumber : i + 1);
  const isActive = (w, i) => activeWeek === getDisplayNum(w, i);

  const calcWeekProgress = (week) => {
    let total = 0, done = 0;
    week.days.forEach(day => {
      day.sessions.forEach(s => {
        total++;
        if (progress?.[s.sessionId]) done++;
      });
    });
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  };

  return (
    <div className="week-tabs-row">
      {weeks.map((week, idx) => {
        const displayNum = getDisplayNum(week, idx);
        const active = isActive(week, idx);
        const wp = calcWeekProgress(week);
        const weekTitle = week.portfolioProject?.weekMilestone || week.theme || '';
        
        return (
          <button
            key={idx}
            className={`week-tab ${active ? 'active' : ''}`}
            onClick={() => onSelect(displayNum)}
          >
            <div className="week-tab-weeknum">Week {displayNum}</div>
            <div className="week-tab-title" title={weekTitle}>
              {weekTitle}
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="week-tab-stats">{wp.done}/{wp.total}</span>
            </div>
            <div className="progress-bar-bg" style={{ height: '4px' }}>
              <div className="progress-bar-fill" style={{ width: `${wp.pct}%` }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
