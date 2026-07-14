import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { EmployerHub } from '../screens/EmployerHub';
import { WorkerFindGigs } from '../screens/WorkerFindGigs';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: 'business' | 'worker' }) {
  const { isAuthenticated, currentUser } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (currentUser?.role !== allowedRole) {
    return <Navigate to={currentUser?.role === 'business' ? '/employer' : '/worker'} replace />;
  }
  return <>{children}</>;
}

function TestRoutes() {
  const { isAuthenticated, currentUser } = useAuthStore();
  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated
          ? <Navigate to={currentUser?.role === 'business' ? '/employer' : '/worker'} replace />
          : <WelcomeScreen />
      } />
      <Route path="/employer" element={
        <ProtectedRoute allowedRole="business"><EmployerHub /></ProtectedRoute>
      } />
      <Route path="/worker" element={
        <ProtectedRoute allowedRole="worker"><WorkerFindGigs /></ProtectedRoute>
      } />
    </Routes>
  );
}

function renderWithRouter(initialRoute: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <TestRoutes />
    </MemoryRouter>
  );
}

describe('Routing', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should show welcome screen when not authenticated', () => {
    renderWithRouter('/');
    expect(screen.getByText('Get started')).toBeInTheDocument();
    expect(screen.getByText('I want to Hire')).toBeInTheDocument();
    expect(screen.getByText('I want to Work')).toBeInTheDocument();
  });

  it('should redirect to employer hub when business user is authenticated', () => {
    useAuthStore.getState().login('employer@urgigs.com', 'pass');
    renderWithRouter('/');
    expect(screen.getByText('Employer Hub')).toBeInTheDocument();
  });

  it('should redirect to find gigs when worker user is authenticated', () => {
    useAuthStore.getState().login('worker@urgigs.com', 'pass');
    renderWithRouter('/');
    expect(screen.getByRole('heading', { name: 'Find Gigs' })).toBeInTheDocument();
  });

  it('should redirect worker away from employer route', () => {
    useAuthStore.getState().login('worker@urgigs.com', 'pass');
    renderWithRouter('/employer');
    expect(screen.getByRole('heading', { name: 'Find Gigs' })).toBeInTheDocument();
  });

  it('should redirect employer away from worker route', () => {
    useAuthStore.getState().login('employer@urgigs.com', 'pass');
    renderWithRouter('/worker');
    expect(screen.getByText('Employer Hub')).toBeInTheDocument();
  });

  it('should redirect unauthenticated user from protected routes', () => {
    renderWithRouter('/employer');
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });
});
