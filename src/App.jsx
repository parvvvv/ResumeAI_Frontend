import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { SearchProvider } from './context/SearchContext';
import { JobsProvider } from './context/JobsContext';
import { ResumeProvider } from './context/ResumeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Editor from './pages/Editor';
import Tailor from './pages/Tailor';
import Preview from './pages/Preview';
import Jobs from './pages/Jobs';
import './index.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/editor/:resumeId" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
        <Route path="/tailor/:resumeId" element={<ProtectedRoute><Tailor /></ProtectedRoute>} />
        <Route path="/preview/:resumeId" element={<ProtectedRoute><Preview /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />

        {/* Default */}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <SearchProvider>
              <ResumeProvider>
                <JobsProvider>
                  <AppRoutes />
                </JobsProvider>
              </ResumeProvider>
            </SearchProvider>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
