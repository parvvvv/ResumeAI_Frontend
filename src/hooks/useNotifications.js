import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Hook that connects to the SSE notification stream.
 * Place this once in a top-level component (like App).
 * Automatically reconnects on disconnect.
 */
export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const connect = () => {
      const url = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('pdf_ready', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast(data.message || 'PDF ready!', 'success', 6000);
        } catch {
          addToast('PDF ready!', 'success', 6000);
        }
      });

      es.addEventListener('pdf_failed', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast(data.message || 'PDF failed.', 'error', 8000);
        } catch {
          addToast('PDF generation failed.', 'error', 8000);
        }
      });

      es.addEventListener('tailor_complete', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast(data.message || 'Resume tailored!', 'success', 6000);
        } catch {
          addToast('Resume tailored!', 'success', 6000);
        }
      });

      es.addEventListener('tailor_failed', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast(data.message || 'Tailoring failed.', 'error', 8000);
        } catch {
          addToast('Tailoring failed.', 'error', 8000);
        }
      });

      es.onerror = () => {
        es.close();
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isAuthenticated, addToast]);
}
