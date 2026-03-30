import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext(null);

/**
 * NotificationProvider — manages the SSE connection and provides a pub/sub
 * system so any component can react to specific notification events.
 */
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const listenersRef = useRef({});    // { eventName: Set<callback> }
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);

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

  // --- SSE Connection ---
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

      // --- PDF Ready: actionable toast with download ---
      es.addEventListener('pdf_ready', (e) => {
        try {
          const payload = JSON.parse(e.data);
          addToast(
            payload.message || 'Your PDF is ready to download!',
            'success',
            10000,
            {
              label: '⬇ Download',
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

      // --- Tailor Complete: toast + emit for dashboard refresh ---
      es.addEventListener('tailor_complete', (e) => {
        try {
          const payload = JSON.parse(e.data);
          addToast(payload.message || 'Resume tailored successfully!', 'success', 6000);
          emit('tailor_complete', payload);
        } catch {
          addToast('Resume tailored!', 'success', 6000);
          emit('tailor_complete', {});
        }
      });

      // --- Tailor Failed ---
      es.addEventListener('tailor_failed', (e) => {
        try {
          const payload = JSON.parse(e.data);
          addToast(payload.message || 'Tailoring failed.', 'error', 8000);
          emit('tailor_failed', payload);
        } catch {
          addToast('Tailoring failed.', 'error', 8000);
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
    <NotificationContext.Provider value={{ onEvent, offEvent }}>
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
