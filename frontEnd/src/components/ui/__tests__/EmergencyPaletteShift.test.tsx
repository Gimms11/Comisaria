import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MainLayout } from '../../layout/MainLayout';
import { useWebSocketStore } from '../../../stores/websocketStore';
import { useAuthStore } from '../../../stores/authStore';

describe('MainLayout emergency palette shift', () => {
  beforeEach(() => {
    useWebSocketStore.setState({
      isFlashingRed: false,
    });
    useAuthStore.setState({
      officer: {
        id: '1',
        email: 'oficial@tinguina.gob.pe',
        full_name: 'Oficial Test',
        role: 'operador',
        is_active: true,
      },
      isAuthenticated: true,
    });
  });

  it('renders standard layout without emergency-palette-red when isFlashingRed is false', () => {
    render(
      <MemoryRouter>
        <MainLayout>
          <div>Child Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    const container = screen.getByTestId('main-layout-container');
    expect(container.className).not.toContain('emergency-palette-red');
  });

  it('applies emergency-palette-red class and renders tint when isFlashingRed is true', () => {
    useWebSocketStore.setState({
      isFlashingRed: true,
    });

    render(
      <MemoryRouter>
        <MainLayout>
          <div>Child Content</div>
        </MainLayout>
      </MemoryRouter>
    );

    const container = screen.getByTestId('main-layout-container');
    expect(container.className).toContain('emergency-palette-red');
    expect(screen.getByTestId('emergency-red-tint')).toBeInTheDocument();
  });
});
