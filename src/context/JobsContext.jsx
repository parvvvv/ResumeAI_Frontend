import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNotificationEvents } from './NotificationContext';
import { useResumes } from './ResumeContext';
import api from '../api/client';

const JobsContext = createContext(null);

/**
 * JobsProvider - manages job recommendations state globally.
 * Exposes: jobs, profile, status, fetchJobs, tailorForJob, baseResumes.
 *
 * Status values:
 *   'idle'      → grey  (no generated resumes yet / never fetched)
 *   'loading'   → orange pulse (fetch in progress)
 *   'found'     → green (jobs available)
 *   'empty'     → orange (fetched but 0 results)
 *   'error'     → red (API failed)
 */
export function JobsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { onEvent, offEvent, setProcessingJobs, emit } = useNotificationEvents();
  const { baseResumes } = useResumes();
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [queryUsed, setQueryUsed] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | found | empty | error
  const [tailoringStatus, setTailoringStatus] = useState({}); // { [job_id]: 'loading' | 'success' | 'error' }
  const hasFetchedRef = useRef(false);

  const fetchJobs = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await api.get('/jobs/recommendations');
      const data = res.data;
      setJobs(data.jobs || []);
      setProfile(data.profile || null);
      setQueryUsed(data.query_used || '');
      setStatus(data.jobs?.length > 0 ? 'found' : 'empty');
    } catch (err) {
      console.error('Failed to fetch job recommendations:', err);
      setStatus('error');
    }
  }, []);


  const tailorForJob = useCallback(async (jobId, baseResumeId) => {
    // 1. Seed the jobs UI state
    setTailoringStatus((prev) => ({ ...prev, [jobId]: 'loading' }));

    // 2. Seed the global progress state so the Dashboard ProcessingCard appears!
    setProcessingJobs((prev) => ({
      ...prev,
      [baseResumeId]: { percent: 5, stage: 0, message: 'Warming up AI...' },
    }));

    const token = localStorage.getItem('token');
    if (!token) return;

    // Run Stream in background so we don't block
    (async () => {
      try {
        const response = await fetch('/api/jobs/tailor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ job_id: jobId, base_resume_id: baseResumeId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop();

          for (const part of parts) {
            if (!part.trim()) continue;

            let eventType = 'message';
            let eventData = '';

            for (const line of part.split('\n')) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                eventData = line.slice(6);
              }
            }

            if (!eventData) continue;

            try {
              const payload = JSON.parse(eventData);
              const { data, message } = payload;

              if (eventType === 'tailor_progress') {
                setProcessingJobs((prev) => ({
                  ...prev,
                  [baseResumeId]: {
                    percent: data?.percent ?? 0,
                    stage: data?.stage ?? 0,
                    message: message || '',
                  },
                }));
              } else if (eventType === 'tailor_complete') {
                setTailoringStatus((prev) => ({ ...prev, [jobId]: 'success' }));
                setProcessingJobs((prev) => ({
                  ...prev,
                  [baseResumeId]: { percent: 100, stage: 5, message: 'Done!' },
                }));
                setTimeout(() => {
                  setProcessingJobs((prev) => {
                    const next = { ...prev };
                    delete next[baseResumeId];
                    return next;
                  });
                }, 1200);
                emit('tailor_complete', payload);
              } else if (eventType === 'tailor_failed') {
                setTailoringStatus((prev) => ({ ...prev, [jobId]: 'error' }));
                setProcessingJobs((prev) => {
                  const next = { ...prev };
                  delete next[baseResumeId];
                  return next;
                });
                emit('tailor_failed', payload);
              }
            } catch { /* ignore parse error */ }
          }
        }
      } catch (err) {
        console.error('Job tailor stream error:', err);
        setTailoringStatus((prev) => ({ ...prev, [jobId]: 'error' }));
        setProcessingJobs((prev) => {
           const next = { ...prev };
           delete next[baseResumeId];
           return next;
        });
      }
    })();
  }, [setProcessingJobs, emit]);

  // Auto-fetch on first auth (only once)
  useEffect(() => {
    if (!isAuthenticated || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchJobs();
  }, [isAuthenticated, fetchJobs]);

  // Re-fetch when a new tailored resume is created (background cron-like)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewResume = () => {
      // Small delay to let DB settle, then fetch fresh recommendations
      setTimeout(() => fetchJobs(), 2000);
    };

    onEvent('tailor_complete', handleNewResume);
    return () => offEvent('tailor_complete', handleNewResume);
  }, [isAuthenticated, onEvent, offEvent, fetchJobs]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setJobs([]);
      setProfile(null);
      setQueryUsed('');
      setStatus('idle');
      setTailoringStatus({});
      hasFetchedRef.current = false;
    }
  }, [isAuthenticated]);

  return (
    <JobsContext.Provider value={{
      jobs,
      profile,
      queryUsed,
      status,
      baseResumes,
      tailoringStatus,
      fetchJobs,
      tailorForJob,
    }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
}
