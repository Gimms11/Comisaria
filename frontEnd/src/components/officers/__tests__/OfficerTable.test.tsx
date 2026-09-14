import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OfficerTable } from '../OfficerTable';
import { Officer } from '../../../types';

const mockOfficers: Officer[] = [
  {
    id: 'off-1',
    full_name: 'Capitán Juan Perez',
    email: 'jperez@pnp.gob.pe',
    role: 'comisario',
    is_active: true,
  },
  {
    id: 'off-2',
    full_name: 'Suboficial Maria Lopez',
    email: 'mlopez@pnp.gob.pe',
    role: 'operador',
    is_active: false,
  },
];

describe('OfficerTable component', () => {
  it('renders loading state when isLoading is true', () => {
    render(
      <OfficerTable
        officers={[]}
        isLoading={true}
        isAdmin={true}
        onToggleActive={vi.fn()}
      />
    );
    expect(screen.getAllByText(/cargando dotación policial/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders officers in both desktop table and mobile card views', () => {
    render(
      <OfficerTable
        officers={mockOfficers}
        isLoading={false}
        isAdmin={false}
        onToggleActive={vi.fn()}
      />
    );

    expect(screen.getAllByText('Capitán Juan Perez').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Suboficial Maria Lopez').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onToggleActive when status toggle button is clicked by admin', () => {
    const handleToggle = vi.fn();
    render(
      <OfficerTable
        officers={mockOfficers}
        isLoading={false}
        isAdmin={true}
        onToggleActive={handleToggle}
      />
    );

    const toggleButtons = screen.getAllByRole('button');
    expect(toggleButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(toggleButtons[0]);
    expect(handleToggle).toHaveBeenCalledWith(mockOfficers[0]);
  });
});
