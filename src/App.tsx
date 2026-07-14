import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { EmployerHub } from './screens/EmployerHub';
import { PostShiftScreen } from './screens/PostShiftScreen';
import { EmployerProfile } from './screens/EmployerProfile';
import { WorkerDiscovery } from './screens/WorkerDiscovery';
import { WorkerFindGigs } from './screens/WorkerFindGigs';
import { WorkerEarnings } from './screens/WorkerEarnings';
import { WorkerProfile } from './screens/WorkerProfile';
import { AdminDashboard } from './screens/AdminDashboard';
import { NotificationBanner } from './components/NotificationBanner';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: 'business' | 'worker' | 'admin' }) {
  const { isAuthenticated, currentUser } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (currentUser?.role !== allowedRole) {
    const redirectPath = currentUser?.role === 'admin' ? '/admin' : currentUser?.role === 'business' ? '/employer' : '/worker';
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{children}</>;
}

function AuthRedirect() {
  const { isAuthenticated, currentUser } = useAuthStore();
  
  if (isAuthenticated) {
    if (currentUser?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to={currentUser?.role === 'business' ? '/employer' : '/worker'} replace />;
  }
  
  return <WelcomeScreen />;
}

function App() {
  return (
    <BrowserRouter>
      <NotificationBanner />
      <Routes>
        <Route path="/" element={<AuthRedirect />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Employer Routes */}
        <Route
          path="/employer"
          element={
            <ProtectedRoute allowedRole="business">
              <EmployerHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/post"
          element={
            <ProtectedRoute allowedRole="business">
              <PostShiftScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/discover"
          element={
            <ProtectedRoute allowedRole="business">
              <WorkerDiscovery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer/profile"
          element={
            <ProtectedRoute allowedRole="business">
              <EmployerProfile />
            </ProtectedRoute>
          }
        />

        {/* Worker Routes */}
        <Route
          path="/worker"
          element={
            <ProtectedRoute allowedRole="worker">
              <WorkerFindGigs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/earnings"
          element={
            <ProtectedRoute allowedRole="worker">
              <WorkerEarnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/profile"
          element={
            <ProtectedRoute allowedRole="worker">
              <WorkerProfile />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
