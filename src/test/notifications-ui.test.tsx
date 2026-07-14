import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/authStore';
import { db } from '../store/database';

function renderHeader() {
  return render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );
}

describe('Header Notifications UI', () => {
  beforeEach(() => {
    db.reset();
    // Login as worker
    useAuthStore.getState().login('worker@urgigs.com', 'password');
  });

  it('renders the notification bell icon', () => {
    renderHeader();
    const bell = screen.getByTestId('notification-bell');
    expect(bell).toBeInTheDocument();
  });

  it('shows badge when there are unread notifications', () => {
    db.createNotification('usr_wrk_001', 'Test notification');
    renderHeader();
    const badge = screen.getByTestId('notification-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBe('1');
  });

  it('does not show badge when there are no unread notifications', () => {
    renderHeader();
    const badge = screen.queryByTestId('notification-badge');
    expect(badge).not.toBeInTheDocument();
  });

  it('opens drawer when bell is clicked', () => {
    db.createNotification('usr_wrk_001', 'Hello world');
    renderHeader();
    
    const bell = screen.getByTestId('notification-bell');
    fireEvent.click(bell);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows mark all as read when unread notifications exist', () => {
    db.createNotification('usr_wrk_001', 'Unread msg');
    renderHeader();

    const bell = screen.getByTestId('notification-bell');
    fireEvent.click(bell);

    expect(screen.getByText('Mark all as read')).toBeInTheDocument();
  });

  it('marks all as read when button clicked', () => {
    db.createNotification('usr_wrk_001', 'Msg 1');
    db.createNotification('usr_wrk_001', 'Msg 2');
    renderHeader();

    const bell = screen.getByTestId('notification-bell');
    fireEvent.click(bell);

    const markRead = screen.getByText('Mark all as read');
    fireEvent.click(markRead);

    // Badge should disappear
    const badge = screen.queryByTestId('notification-badge');
    expect(badge).not.toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    renderHeader();
    
    const bell = screen.getByTestId('notification-bell');
    fireEvent.click(bell);
    
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('displays notifications newest first', () => {
    db.createNotification('usr_wrk_001', 'First notification');
    db.createNotification('usr_wrk_001', 'Second notification');
    renderHeader();
    
    const bell = screen.getByTestId('notification-bell');
    fireEvent.click(bell);
    
    const items = screen.getAllByText(/notification/i);
    // The drawer title "Notifications" + "Second notification" + "First notification"
    const messages = items.filter(el => el.textContent?.includes('notification') && el.tagName === 'P');
    expect(messages[0].textContent).toBe('Second notification');
    expect(messages[1].textContent).toBe('First notification');
  });
});
