import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LiveAlertToast } from '../LiveAlertToast';
import { useWebSocketStore } from '../../../stores/websocketStore';
import { useUiStore } from '../../../stores/uiStore';

describe('LiveAlertToast component', () => {
  beforeEach(() => {
    useWebSocketStore.setState({
      activeNotification: null,
    });
    useUiStore.setState({
      activeTab: 'dashboard',
      selectedCrimeReportId: null,
    });
  });

  it('renders nothing when activeNotification is null', () => {
    render(
      <MemoryRouter>
        <LiveAlertToast />
      </MemoryRouter>
    );
    expect(screen.queryByTestId('live-alert-toast')).not.toBeInTheDocument();
  });

  it('renders alert information when activeNotification is present', () => {
    useWebSocketStore.setState({
      activeNotification: {
        id: 'test-1',
        event_type: 'NEW_CRIME_REPORT',
        public_code: 'LT-2026-000009',
        priority: 'urgente',
        category_name: 'Asalto a mano armada',
        timestamp: new Date().toISOString(),
        read: false,
      },
    });

    render(
      <MemoryRouter>
        <LiveAlertToast />
      </MemoryRouter>
    );

    expect(screen.getByTestId('live-alert-toast')).toBeInTheDocument();
    expect(screen.getByText('LT-2026-000009')).toBeInTheDocument();
    expect(screen.getByText('Asalto a mano armada')).toBeInTheDocument();
    expect(screen.getByText(/ALERTA SOS POLICIAL/i)).toBeInTheDocument();

    // Click Intervenir
    const intervenirBtn = screen.getByRole('button', { name: /Intervenir/i });
    fireEvent.click(intervenirBtn);

    expect(useUiStore.getState().activeTab).toBe('crime_reports');
    expect(useUiStore.getState().selectedCrimeReportId).toBe('LT-2026-000009');
    expect(useWebSocketStore.getState().activeNotification).toBeNull();
  });
});
