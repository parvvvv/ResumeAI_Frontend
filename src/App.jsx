import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { SearchProvider } from './context/SearchContext';
import { JobsProvider } from './context/JobsContext';
import { ResumeProvider } from './context/ResumeContext';
import Navbar from './components/Navbar';

import ChatbotPanel from './components/chatbot';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Editor from './pages/Editor';
import Tailor from './pages/Tailor';
import Preview from './pages/Preview';
import Jobs from './pages/Jobs';
import AdminDashboard from './pages/AdminDashboard';
import Templates from './pages/Templates';
import TemplateEditor from './pages/TemplateEditor';
import SharedTemplate from './pages/SharedTemplate';
import { canAccessTemplatePlatform } from './lib/templatePlatform';
import './index.css';

const MotionDiv = motion.div;

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
}

function TemplatePlatformRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return canAccessTemplatePlatform(user) ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const navDirection = typeof location.state?.navDirection === 'number'
    ? location.state.navDirection
    : 0;

  const routeTransition = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, x: navDirection >= 0 ? 28 : -28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: navDirection >= 0 ? -28 : 28 },
        transition: { type: 'spring', stiffness: 360, damping: 34, mass: 0.7 },
      };

  return (
    <>
      <Navbar />
      {isAuthenticated && <ChatbotPanel />}
      <div className="route-transition-viewport">
        <AnimatePresence mode="wait" initial={false} custom={navDirection}>
          <MotionDiv
            key={location.pathname}
            className="route-transition-page"
            {...routeTransition}
          >
            <Routes location={location}>
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
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/templates" element={<TemplatePlatformRoute><Templates /></TemplatePlatformRoute>} />
              <Route path="/templates/share/:token" element={<ProtectedRoute><SharedTemplate /></ProtectedRoute>} />
              <Route path="/templates/:templateId" element={<TemplatePlatformRoute><TemplateEditor /></TemplatePlatformRoute>} />

              {/* Default */}
              <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
            </Routes>
          </MotionDiv>
        </AnimatePresence>
      </div>
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
