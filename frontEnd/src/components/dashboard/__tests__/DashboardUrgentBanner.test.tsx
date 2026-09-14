import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardUrgentBanner } from '../DashboardUrgentBanner';
import { LiveAlertEvent } from '../../../types';

const mockAlert: LiveAlertEvent = {
  id: 'alert-1',
  event_type: 'NEW_CRIME_REPORT',
  public_code: 'DA-2026-999',
  priority: 'urgente',
  category_name: 'Asalto a Mano Armada',
  timestamp: new Date().toISOString(),
};

describe('DashboardUrgentBanner component', () => {
  it('renders alert code, category and triggers intervention handler', () => {
    const handleIntervene = vi.fn();

    render(
      <DashboardUrgentBanner
        alert={mockAlert}
        onIntervene={handleIntervene}
      />
    );

    expect(screen.getByText('ALERTA SOS')).toBeInTheDocument();
    expect(screen.getByText(/DA-2026-999/)).toBeInTheDocument();
    expect(screen.getByText(/Asalto a Mano Armada/)).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /intervenir/i });
    fireEvent.click(button);
    expect(handleIntervene).toHaveBeenCalledTimes(1);
  });
});
