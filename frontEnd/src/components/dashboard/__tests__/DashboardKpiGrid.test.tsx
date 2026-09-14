import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardKpiGrid } from '../DashboardKpiGrid';

describe('DashboardKpiGrid component', () => {
  it('renders operational KPIs for police roles (admin/comisario/operador)', () => {
    const handleNavigate = vi.fn();

    render(
      <DashboardKpiGrid
        role="operador"
        urgentCount={4}
        inProgressCount={7}
        pendingCount={12}
        activeOfficersCount={15}
        communityTotal={25}
        communityPending={3}
        publishedGuidesCount={5}
        totalGuidesCount={8}
        totalShares={64}
        onNavigate={handleNavigate}
      />
    );

    expect(screen.getByText('URGENCIAS ACTIVAS')).toBeInTheDocument();
    expect(screen.getByText('EN ATENCIÓN / TURNO')).toBeInTheDocument();
    expect(screen.getByText('PENDIENTES DE REVISIÓN')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    const urgentCard = screen.getByText('URGENCIAS ACTIVAS').closest('div');
    if (urgentCard) {
      fireEvent.click(urgentCard);
      expect(handleNavigate).toHaveBeenCalledWith('crime_reports');
    }
  });

  it('renders civic community KPIs for moderador role', () => {
    const handleNavigate = vi.fn();

    render(
      <DashboardKpiGrid
        role="moderador"
        urgentCount={0}
        inProgressCount={0}
        pendingCount={0}
        activeOfficersCount={0}
        communityTotal={30}
        communityPending={5}
        publishedGuidesCount={10}
        totalGuidesCount={12}
        totalShares={128}
        onNavigate={handleNavigate}
      />
    );

    expect(screen.getByText('INCIDENTES VECINALES')).toBeInTheDocument();
    expect(screen.getByText('PENDIENTES SERENAZGO')).toBeInTheDocument();
    expect(screen.getByText('GUÍAS PUBLICADAS')).toBeInTheDocument();
    expect(screen.getByText('DIFUSIÓN COMUNITARIA')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
  });
});
