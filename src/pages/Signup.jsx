import { Link } from 'react-router-dom';
import { HiOutlineLockClosed } from 'react-icons/hi';
import AuthLayout from '../components/AuthLayout';

export default function Signup() {
  return (
    <AuthLayout>
      <div className="auth-card glass">
        <div className="auth-card-header">
          <h1>Request access</h1>
          <p>Accounts are provisioned by your administrator.</p>
        </div>

        <div className="auth-notice">
          <span className="auth-notice-icon">
            <HiOutlineLockClosed size={22} />
          </span>
          <div>
            <h3 className="title-md">Registration restricted</h3>
            <p className="body-sm text-muted">
              Self-registration is disabled on this platform. Please contact your system
              administrator to request an account.
            </p>
          </div>
        </div>

        <Link to="/login" className="btn btn-secondary btn-lg auth-submit">
          Return to Log In
        </Link>
      </div>
    </AuthLayout>
  );
}
