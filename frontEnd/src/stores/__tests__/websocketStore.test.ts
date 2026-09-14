import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useWebSocketStore } from '../websocketStore';
import { LiveAlertEvent } from '../../types';

describe('useWebSocketStore alert flashing & live toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useWebSocketStore.setState({
      status: 'DISCONNECTED',
      soundEnabled: false, // disable audio during tests
      alerts: [],
      unreadEmergencyCount: 0,
      latestAlert: null,
      isFlashingRed: false,
      activeNotification: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('triggers dark red flash and activates notification on triggerAlertFlash', () => {
    const alert: LiveAlertEvent = {
      id: 'test-1',
      event_type: 'NEW_CRIME_REPORT',
      public_code: 'LT-2026-009999',
      priority: 'urgente',
      category_name: 'Robo a mano armada',
      timestamp: new Date().toISOString(),
      read: false,
    };

    useWebSocketStore.getState().triggerAlertFlash(alert);

    let state = useWebSocketStore.getState();
    expect(state.isFlashingRed).toBe(true);
    expect(state.activeNotification).toEqual(alert);

    // Fast-forward 1300ms -> palette shift turns off
    vi.advanceTimersByTime(1300);
    state = useWebSocketStore.getState();
    expect(state.isFlashingRed).toBe(false);
    expect(state.activeNotification).toEqual(alert);

    // Fast-forward to 7000ms -> toast auto dismisses
    vi.advanceTimersByTime(6500);
    state = useWebSocketStore.getState();
    expect(state.activeNotification).toBeNull();
  });

  it('simulates an incoming alert correctly', async () => {
    await useWebSocketStore.getState().simulateIncomingAlert('crime', true);

    const state = useWebSocketStore.getState();
    expect(state.isFlashingRed).toBe(true);
    expect(state.activeNotification).not.toBeNull();
    expect(state.latestAlert).not.toBeNull();
    expect(state.alerts.length).toBe(1);
    expect(state.unreadEmergencyCount).toBe(1);
  });

  it('dismisses notification manually', async () => {
    await useWebSocketStore.getState().simulateIncomingAlert('crime', true);
    expect(useWebSocketStore.getState().activeNotification).not.toBeNull();

    useWebSocketStore.getState().dismissNotification();
    expect(useWebSocketStore.getState().activeNotification).toBeNull();
  });

  it('does NOT trigger red flash or toast notification on STATUS_CHANGED progress events', () => {
    const statusEvent: LiveAlertEvent = {
      id: 'status-change-1',
      event_type: 'STATUS_CHANGED',
      public_code: 'LT-2026-001234',
      priority: 'urgente',
      category_name: 'Denuncia',
      extra_data: { old_status: 'pendiente', new_status: 'en_investigacion' },
      timestamp: new Date().toISOString(),
      read: false,
    };

    useWebSocketStore.getState().triggerAlertFlash(statusEvent);

    const state = useWebSocketStore.getState();
    expect(state.isFlashingRed).toBe(false);
    expect(state.activeNotification).toBeNull();
  });
});
