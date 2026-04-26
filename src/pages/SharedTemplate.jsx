import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { PageShell } from '../components/ui';
import { useToast } from '../context/ToastContext';

export default function SharedTemplate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [status, setStatus] = useState('accepting'); // accepting | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No share token provided.');
      return;
    }

    api.post(`/templates/accept-share?token=${encodeURIComponent(token)}`)
      .then((res) => {
        addToast(`Access granted to "${res.data.title || 'Shared Template'}"!`, 'success');
        navigate(`/templates/${res.data.templateId}`, { replace: true });
      })
      .catch((err) => {
        setStatus('error');
        const detail = err?.response?.data?.detail;
        setErrorMsg(
          typeof detail === 'string' ? detail : detail?.message || 'Invalid or expired share token.'
        );
      });
  }, [token]);

  return (
    <PageShell>
      <div className="shared-template-page">
        {status === 'accepting' && (
          <div className="shared-template-loader">
            <div className="spinner" />
            <h2>Accepting share link…</h2>
            <p className="text-secondary">You'll be redirected to the template shortly.</p>
          </div>
        )}
        {status === 'error' && (
          <div className="shared-template-error">
            <h2>Share Link Error</h2>
            <p className="text-secondary">{errorMsg}</p>
            <button className="btn btn-primary" onClick={() => navigate('/templates')}>
              Go to Templates
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
