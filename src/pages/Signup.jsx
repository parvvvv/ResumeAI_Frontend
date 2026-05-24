import { Link } from 'react-router-dom';
import { HiOutlineLockClosed } from 'react-icons/hi';
import Logo from '../components/Logo';

export default function Signup() {
  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-card glass">
        <div className="auth-logo">
          <Logo size={64} className="mb-4 animate-float" />
          <h1>Hirecraft</h1>
          <p>AI-powered career acceleration</p>
        </div>

        <div className="text-center py-6 px-4 rounded-2xl glass-subtle border border-warning/10 my-6 animate-pulse-slow">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-warning/10 text-warning mb-4">
            <HiOutlineLockClosed size={24} />
          </div>
          <h3 className="title-md mb-2" style={{ color: 'var(--warning)' }}>Registration Restricted</h3>
          <p className="body-sm text-muted leading-relaxed">
            Self-registration is disabled on this platform. Please contact your system administrator to request an account.
          </p>
        </div>

        <div className="auth-footer mt-4">
          <Link to="/login" className="btn btn-secondary w-full justify-center py-3 text-center">
            Return to Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
