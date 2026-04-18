import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext(null);

/**
 * NotificationProvider — manages the SSE connection for general notifications
 * and provides startTailorStream() for streaming tailor progress directly from
 * the /api/resume/tailor endpoint.
 */
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const listenersRef = useRef({});    // { eventName: Set<callback> }
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  // --- Progress state ---
  // processingJobs: { [baseResumeId]: { percent, stage, message, earlyAtsScore?, matchedKeywords?, missingKeywords? } }
  const [processingJobs, setProcessingJobs] = useState({});
  // parseProgress: { percent, stage } | null
  const [parseProgress, setParseProgress] = useState(null);

  // --- Pub/Sub API ---
  const onEvent = useCallback((eventName, callback) => {
    if (!listenersRef.current[eventName]) {
      listenersRef.current[eventName] = new Set();
    }
    listenersRef.current[eventName].add(callback);
  }, []);

  const offEvent = useCallback((eventName, callback) => {
    listenersRef.current[eventName]?.delete(callback);
  }, []);

  const emit = useCallback((eventName, payload) => {
    listenersRef.current[eventName]?.forEach((cb) => {
      try { cb(payload); } catch (e) { console.error('Notification listener error:', e); }
    });
  }, []);

  // --- Streaming tailor progress ---
  const startTailorStream = useCallback((baseResumeId, jobDescription) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Seed processingJobs immediately so the card appears
    setProcessingJobs((prev) => ({
      ...prev,
      [baseResumeId]: { percent: 5, stage: 0, message: 'Starting AI tailoring...' },
    }));

    // Fire-and-forget — the promise keeps running after navigation
    (async () => {
      try {
        const response = await fetch('/api/resume/tailor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ baseResumeId, jobDescription }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const parts = buffer.split('\n\n');
          buffer = parts.pop(); // keep incomplete chunk

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
                    earlyAtsScore: data?.earlyAtsScore ?? prev[baseResumeId]?.earlyAtsScore,
                    matchedKeywords: data?.matchedKeywords ?? prev[baseResumeId]?.matchedKeywords,
                    missingKeywords: data?.missingKeywords ?? prev[baseResumeId]?.missingKeywords,
                  },
                }));
              } else if (eventType === 'tailor_complete') {
                // Set to 100% briefly so the bar completes, then remove
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
                addToast(payload.message || 'Resume tailored successfully!', 'success', 6000);
                emit('tailor_complete', payload);
              } else if (eventType === 'tailor_failed') {
                setProcessingJobs((prev) => {
                  const next = { ...prev };
                  delete next[baseResumeId];
                  return next;
                });
                addToast(payload.message || 'Tailoring failed.', 'error', 8000);
                emit('tailor_failed', payload);
              }
            } catch { /* ignore parse errors */ }
          }
        }
      } catch (err) {
        console.error('Tailor stream error:', err);
        setProcessingJobs((prev) => {
          const next = { ...prev };
          delete next[baseResumeId];
          return next;
        });
        addToast('Tailoring failed. Please try again.', 'error', 8000);
      }
    })();
  }, [addToast, emit]);

  // --- SSE Connection (for parse progress, PDF events, etc.) ---
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const connect = () => {
      // Clean up any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      // --- Parse Progress ---
      es.addEventListener('parse_progress', (e) => {
        try {
          const payload = JSON.parse(e.data);
          const { data, message } = payload;
          setParseProgress({ percent: data?.percent ?? 0, stage: message });
          emit('parse_progress', payload);
        } catch { /* ignore */ }
      });

      // --- PDF Ready: actionable toast with download ---
      es.addEventListener('pdf_ready', (e) => {
        try {
          const payload = JSON.parse(e.data);
          addToast(
            payload.message || 'Your PDF is ready to download!',
            'success',
            10000,
            {
              label: 'Download',
              onClick: () => {
                const link = document.createElement('a');
                link.href = payload.data?.pdfUrl;
                link.download = 'resume.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              },
            }
          );
          emit('pdf_ready', payload);
        } catch {
          addToast('PDF ready!', 'success', 6000);
        }
      });

      // --- PDF Failed ---
      es.addEventListener('pdf_failed', (e) => {
        try {
          const payload = JSON.parse(e.data);
          addToast(payload.message || 'PDF generation failed.', 'error', 8000);
          emit('pdf_failed', payload);
        } catch {
          addToast('PDF generation failed.', 'error', 8000);
        }
      });

      es.onerror = () => {
        es.close();
        // Reconnect after 3 seconds
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [isAuthenticated, addToast, emit]);

  return (
    <NotificationContext.Provider value={{ onEvent, offEvent, processingJobs, setProcessingJobs, parseProgress, setParseProgress, startTailorStream }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationEvents() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationEvents must be used within a NotificationProvider');
  }
  return context;
}
