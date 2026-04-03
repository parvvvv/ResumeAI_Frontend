import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';
import { useNotificationEvents } from './NotificationContext';

const ResumeContext = createContext(null);

export function ResumeProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { onEvent, offEvent } = useNotificationEvents();
  const [baseResumes, setBaseResumes] = useState([]);
  const [generatedResumes, setGeneratedResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const fetchCountRef = useRef(0);

  const fetchResumes = useCallback(async (isSilent = false) => {
    if (!isAuthenticated) return;
    
    const currentFetchId = ++fetchCountRef.current;
    if (!isSilent && !hasInitialFetch) setLoading(true);

    try {
      const [baseRes, genRes] = await Promise.all([
        api.get('/resume'),
        api.get('/dashboard'),
      ]);

      // Only update if this was the latest request
      if (currentFetchId === fetchCountRef.current) {
        setBaseResumes(baseRes.data.resumes || []);
        setGeneratedResumes(genRes.data.resumes || []);
        setHasInitialFetch(true);
      }
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    } finally {
      if (currentFetchId === fetchCountRef.current) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, hasInitialFetch]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated && !hasInitialFetch) {
      fetchResumes();
    }
  }, [isAuthenticated, hasInitialFetch, fetchResumes]);

  // SSE Notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleRefresh = () => {
      // Small delay for DB consistency, then silent refresh
      setTimeout(() => fetchResumes(true), 1500);
    };

    onEvent('tailor_complete', handleRefresh);
    onEvent('pdf_ready', handleRefresh);

    return () => {
      offEvent('tailor_complete', handleRefresh);
      offEvent('pdf_ready', handleRefresh);
    };
  }, [isAuthenticated, onEvent, offEvent, fetchResumes]);

  const deleteBase = async (id) => {
    await api.delete(`/resume/${id}`);
    setBaseResumes(r => r.filter(x => x.id !== id));
  };

  const deleteGenerated = async (id) => {
    await api.delete(`/resume/generated/${id}`);
    setGeneratedResumes(r => r.filter(x => x.id !== id));
  };

  return (
    <ResumeContext.Provider value={{
      baseResumes,
      generatedResumes,
      loading,
      hasInitialFetch,
      fetchResumes,
      deleteBase,
      deleteGenerated
    }}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResumes() {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResumes must be used within a ResumeProvider');
  }
  return context;
}
