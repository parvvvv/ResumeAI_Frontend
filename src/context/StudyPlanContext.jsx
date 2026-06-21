import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { getDailyQuote } from '../lib/quotes';

const StudyPlanContext = createContext(null);

export function StudyPlanProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [archivedPlans, setArchivedPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [dailyQuote, setDailyQuote] = useState(getDailyQuote());
  
  // Streaming state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');

  const fetchPlans = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [activeRes, archivedRes] = await Promise.all([
        api.get('/study-plan/list?status=active'),
        api.get('/study-plan/list?status=archived')
      ]);
      setPlans(activeRes.data || []);
      setArchivedPlans(archivedRes.data || []);
    } catch (err) {
      console.error('Failed to fetch study plans:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlans();
    }
  }, [isAuthenticated, fetchPlans]);

  // Update daily quote at midnight if app is left open
  useEffect(() => {
    const timer = setInterval(() => {
      setDailyQuote(getDailyQuote());
    }, 60 * 60 * 1000); // Check every hour
    return () => clearInterval(timer);
  }, []);

  const fetchPlan = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/study-plan/${id}`);
      setActivePlan(res.data);
      if (res.data.streak?.current !== undefined) {
        setStreak(res.data.streak.current);
      }
      return res.data;
    } catch (err) {
      console.error('Failed to fetch plan details:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async (config) => {
    setIsGenerating(true);
    setGenerationMessage('Starting generation...');
    try {
      // For SSE with our api client we might need native fetch
      const token = localStorage.getItem('token');
      const response = await fetch('/api/study-plan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to generate plan');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let lastPlanId = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setGenerationMessage(data.message);
              } else if (data.type === 'error') {
                throw new Error(data.message);
              } else if (data.type === 'complete') {
                lastPlanId = data.planId;
              }
            } catch {
              console.warn("Failed to parse SSE chunk", line);
            }
          }
        }
      }

      // Fallback: if stream ended without complete event, just refresh plans
      if (lastPlanId) {
        await fetchPlans();
        await fetchPlan(lastPlanId);
        return lastPlanId;
      }
      await fetchPlans();
      return null;
    } finally {
      setIsGenerating(false);
      setGenerationMessage('');
    }
  };

  const toggleSession = async (planId, sessionId, completed) => {
    try {
      // Optimistic update (checkbox + metrics)
      if (activePlan && activePlan.id === planId) {
        setActivePlan(prev => {
          const delta = completed ? 1 : -1;
          const prevSessions = prev.metrics?.sessionsCompleted || 0;
          const total = prev.metrics?.sessionsTotal || 1;
          const newSessions = Math.max(0, prevSessions + delta);
          return {
            ...prev,
            progress: { ...prev.progress, [sessionId]: completed },
            metrics: {
              ...prev.metrics,
              sessionsCompleted: newSessions,
              completionPercent: Math.round((newSessions / total) * 100),
            },
          };
        });
      }

      const res = await api.patch(`/study-plan/${planId}/progress`, {
        sessionId,
        completed
      });
      
      // Apply server response (overrides optimistic with ground truth)
      if (res.data.streak !== undefined) {
        setStreak(res.data.streak);
      }
      if (res.data.completionPercent !== undefined && activePlan?.id === planId) {
        setActivePlan(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            sessionsCompleted: res.data.sessionsCompleted,
            completionPercent: res.data.completionPercent,
          },
        }));
      }
      
      return res.data;
    } catch (err) {
      console.error('Failed to update progress:', err);
      // Revert optimistic update by refetching
      fetchPlan(planId);
      throw err;
    }
  };

  const archivePlan = async (id) => {
    await api.patch(`/study-plan/${id}/archive`);
    setActivePlan(null);
    await fetchPlans();
  };

  const restorePlan = async (id) => {
    await api.patch(`/study-plan/${id}/restore`);
    await fetchPlans();
  };

  const regenerateWeek = async (planId, weekNum) => {
    const res = await api.post(`/study-plan/${planId}/regenerate-week/${weekNum}`, { confirmReset: true });
    await fetchPlan(planId);
    return res.data;
  };

  const generateResumeBullets = async (planId, weekNum) => {
    const res = await api.post(`/study-plan/${planId}/resume-bullets/${weekNum}`);
    await fetchPlan(planId); // Refetch to get the saved bullets
    return res.data.bullets;
  };

  // Derive today's tasks and leftover tasks from activePlan
  const derived = useMemo(() => {
    const result = {
      todaysTasks: [],
      leftoverTasks: [],
      currentRelativeDay: 1,
      currentWeekNumber: 1,
      currentDayInWeek: 1
    };

    if (!activePlan?.startedAt) return result;

    const started = new Date(activePlan.startedAt);
    if (isNaN(started.getTime())) return result;

    const now = new Date();
    const daysPerWeek = activePlan.config?.daysPerWeek || 5;
    const relativeDay = Math.floor((now - started) / (1000 * 60 * 60 * 24)) + 1;
    
    if (relativeDay < 1) return result;

    result.currentRelativeDay = relativeDay;
    result.currentWeekNumber = Math.ceil(relativeDay / daysPerWeek);
    result.currentDayInWeek = ((relativeDay - 1) % daysPerWeek) + 1;
    
    const leftovers = [];
    let todays = [];

    (activePlan.plan?.weeklyPlan || []).forEach((week, weekIdx) => {
      (week.days || []).forEach(day => {
        const globalDayForThis = weekIdx * daysPerWeek + day.dayNumber;
        
        if (globalDayForThis < relativeDay) {
          const unfinished = (day.sessions || []).filter(s => !activePlan.progress?.[s.sessionId]);
          if (unfinished.length > 0) {
            leftovers.push({
              dayLabel: `Day ${day.dayNumber}`,
              weekLabel: `Week ${week.weekNumber}`,
              sessions: unfinished
            });
          }
        }
        
        if (weekIdx + 1 === result.currentWeekNumber && day.dayNumber === result.currentDayInWeek) {
          todays = (day.sessions || []).map(s => ({
            ...s,
            completed: activePlan.progress?.[s.sessionId] || false
          }));
        }
      });
    });

    result.todaysTasks = todays;
    result.leftoverTasks = leftovers;
    return result;
  }, [activePlan]);

  const { todaysTasks, leftoverTasks, currentRelativeDay, currentWeekNumber, currentDayInWeek } = derived;

  return (
    <StudyPlanContext.Provider value={{
      plans,
      archivedPlans,
      activePlan,
      loading,
      streak,
      dailyQuote,
      isGenerating,
      generationMessage,
      todaysTasks,
      leftoverTasks,
      currentRelativeDay,
      currentWeekNumber,
      currentDayInWeek,
      fetchPlans,
      fetchPlan,
      generatePlan,
      toggleSession,
      archivePlan,
      restorePlan,
      regenerateWeek,
      generateResumeBullets
    }}>
      {children}
    </StudyPlanContext.Provider>
  );
}

export function useStudyPlan() {
  const context = useContext(StudyPlanContext);
  if (!context) {
    throw new Error('useStudyPlan must be used within a StudyPlanProvider');
  }
  return context;
}
