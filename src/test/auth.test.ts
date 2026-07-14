import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should start in unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.currentUser).toBeNull();
  });

  it('should login business user with valid email', () => {
    const result = useAuthStore.getState().login('employer@urgigs.com', 'anypassword');
    expect(result).toBe(true);
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.currentUser!.role).toBe('business');
    expect(state.currentUser!.email).toBe('employer@urgigs.com');
    expect(state.businessProfile).not.toBeNull();
    expect(state.businessProfile!.company_name).toBe('Chen Events Co.');
  });

  it('should login worker user with valid email', () => {
    const result = useAuthStore.getState().login('worker@urgigs.com', 'anypassword');
    expect(result).toBe(true);
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.currentUser!.role).toBe('worker');
    expect(state.currentUser!.email).toBe('worker@urgigs.com');
    expect(state.workerProfile).not.toBeNull();
    expect(state.workerProfile!.skills_tags).toContain('bartending');
  });

  it('should fail login with invalid email', () => {
    const result = useAuthStore.getState().login('invalid@email.com', 'password');
    expect(result).toBe(false);
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('No account found with this email address.');
  });

  it('should fail login with empty password', () => {
    const result = useAuthStore.getState().login('employer@urgigs.com', '');
    expect(result).toBe(false);
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Please enter your password.');
  });

  it('should logout correctly', () => {
    useAuthStore.getState().login('employer@urgigs.com', 'pass');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.currentUser).toBeNull();
    expect(state.businessProfile).toBeNull();
    expect(state.workerProfile).toBeNull();
  });

  it('should clear error', () => {
    useAuthStore.getState().login('bad@email.com', 'pass');
    expect(useAuthStore.getState().error).not.toBeNull();
    
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('should route business user to employer hub (role check)', () => {
    useAuthStore.getState().login('employer@urgigs.com', 'pass');
    const state = useAuthStore.getState();
    expect(state.currentUser!.role).toBe('business');
  });

  it('should route worker user to find gigs (role check)', () => {
    useAuthStore.getState().login('worker@urgigs.com', 'pass');
    const state = useAuthStore.getState();
    expect(state.currentUser!.role).toBe('worker');
  });
});
