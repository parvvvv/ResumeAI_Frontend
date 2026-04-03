import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNotificationEvents } from './NotificationContext';
import { useResumes } from './ResumeContext';
import api from '../api/client';

const JobsContext = createContext(null);

/**
 * JobsProvider — manages job recommendations state globally.
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
  const { onEvent, offEvent } = useNotificationEvents();
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
    setTailoringStatus((prev) => ({ ...prev, [jobId]: 'loading' }));
    try {
      const res = await api.post('/jobs/tailor', {
        job_id: jobId,
        base_resume_id: baseResumeId,
      });
      setTailoringStatus((prev) => ({ ...prev, [jobId]: 'success' }));
      return res.data;
    } catch (err) {
      console.error('Failed to tailor for job:', err);
      setTailoringStatus((prev) => ({ ...prev, [jobId]: 'error' }));
      throw err;
    }
  }, []);

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
