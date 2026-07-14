import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationBanner } from '../store/notificationBanner';

describe('Phase 5C - Notification Banner Store', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useNotificationBanner());
    act(() => {
      result.current.clearAll();
    });
  });

  it('starts with empty banners', () => {
    const { result } = renderHook(() => useNotificationBanner());
    expect(result.current.banners).toHaveLength(0);
  });

  it('adds a banner with showBanner', () => {
    const { result } = renderHook(() => useNotificationBanner());
    act(() => {
      result.current.showBanner('error', 'Something went wrong');
    });
    expect(result.current.banners).toHaveLength(1);
    expect(result.current.banners[0].type).toBe('error');
    expect(result.current.banners[0].message).toBe('Something went wrong');
  });

  it('adds multiple banners', () => {
    const { result } = renderHook(() => useNotificationBanner());
    act(() => {
      result.current.showBanner('error', 'Error 1');
      result.current.showBanner('success', 'Success 1');
      result.current.showBanner('info', 'Info 1');
    });
    expect(result.current.banners).toHaveLength(3);
  });

  it('dismisses a specific banner', () => {
    const { result } = renderHook(() => useNotificationBanner());
    act(() => {
      result.current.showBanner('error', 'Error 1');
      result.current.showBanner('success', 'Success 1');
    });
    const bannerId = result.current.banners[0].id;
    act(() => {
      result.current.dismissBanner(bannerId);
    });
    expect(result.current.banners).toHaveLength(1);
    expect(result.current.banners[0].message).toBe('Success 1');
  });

  it('clearAll removes all banners', () => {
    const { result } = renderHook(() => useNotificationBanner());
    act(() => {
      result.current.showBanner('error', 'Error 1');
      result.current.showBanner('success', 'Success 1');
    });
    act(() => {
      result.current.clearAll();
    });
    expect(result.current.banners).toHaveLength(0);
  });
});
