import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardView } from '../DashboardView';
import { api } from '../../../services/api';
import { useWebSocketStore } from '../../../stores/websocketStore';
import { CrimeReportListItem } from '../../../types';

vi.mock('../../../services/api', () => ({
  api: {
    listCrimeReports: vi.fn(),
    listCommunityReports: vi.fn().mockResolvedValue({ items: [] }),
    listAdminGuides: vi.fn().mockResolvedValue([]),
    listOfficers: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: () => ({
    officer: { role: 'comisario', full_name: 'Mayor PNP' },
  }),
}));

describe('DashboardView SOS alert banner rules', () => {
  const baseReport: CrimeReportListItem = {
    id: 'crime-1',
    public_code: 'LT-2026-009999',
    category_name: 'Robo a mano armada',
    status: 'pendiente',
    priority: 'urgente',
    is_emergency: true,
    description: 'Robo en curso',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (< 24h)
    updated_at: new Date().toISOString(),
  };

  it('renders SOS banner when report is urgent/SOS, unresolved, and < 1 day old', async () => {
    vi.mocked(api.listCrimeReports).mockResolvedValueOnce({
      items: [baseReport],
      total: 1,
      limit: 50,
      offset: 0,
    });

    useWebSocketStore.setState({ alerts: [], latestAlert: null });

    render(
      <MemoryRouter>
        <DashboardView />
      </MemoryRouter>
    );

    expect(await screen.findByText('ALERTA SOS')).toBeInTheDocument();
    expect(screen.getAllByText(/LT-2026-009999/).length).toBeGreaterThan(0);
  });

  it('does NOT render SOS banner when report is resuelto (resolved)', async () => {
    const resolvedReport: CrimeReportListItem = {
      ...baseReport,
      id: 'crime-2',
      status: 'resuelto',
    };

    vi.mocked(api.listCrimeReports).mockResolvedValueOnce({
      items: [resolvedReport],
      total: 1,
      limit: 50,
      offset: 0,
    });

    useWebSocketStore.setState({ alerts: [], latestAlert: null });

    render(
      <MemoryRouter>
        <DashboardView />
      </MemoryRouter>
    );

    // Wait for data load
    await screen.findByText('Puesto de Comando y Dirección Operativa');
    expect(screen.queryByText('ALERTA SOS')).not.toBeInTheDocument();
  });

  it('does NOT render SOS banner when report was created more than 1 day ago (> 24h)', async () => {
    const oldReport: CrimeReportListItem = {
      ...baseReport,
      id: 'crime-3',
      created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 36 hours ago (> 24h)
    };

    vi.mocked(api.listCrimeReports).mockResolvedValueOnce({
      items: [oldReport],
      total: 1,
      limit: 50,
      offset: 0,
    });

    useWebSocketStore.setState({ alerts: [], latestAlert: null });

    render(
      <MemoryRouter>
        <DashboardView />
      </MemoryRouter>
    );

    await screen.findByText('Puesto de Comando y Dirección Operativa');
    expect(screen.queryByText('ALERTA SOS')).not.toBeInTheDocument();
  });
});
