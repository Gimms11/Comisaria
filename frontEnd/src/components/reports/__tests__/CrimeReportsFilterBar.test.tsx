import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CrimeReportsFilterBar } from '../CrimeReportsFilterBar';

const mockCategories = [
  {
    id: 'cat-1',
    name: 'Robo Agravado',
    slug: 'robo-agravado',
    applicable_type: 'denuncia_anonima' as const,
    is_emergency_default: false,
    sort_order: 1,
  },
];

describe('CrimeReportsFilterBar component', () => {
  it('renders filter inputs and quick status chips', () => {
    const handleSearchChange = vi.fn();
    const handleStatusChange = vi.fn();

    render(
      <CrimeReportsFilterBar
        statusFilter=""
        isEmergencyOnly={false}
        searchQuery=""
        priorityFilter=""
        categoryIdFilter=""
        dateRangeFilter="all"
        sortField="created_at"
        sortOrder="desc"
        categories={mockCategories}
        statusCounts={{ todos: 10, pendiente: 3, en_revision: 2, en_atencion: 1, derivado: 1, resuelto: 2, archivado: 0, rechazado: 0, sos: 1 }}
        totalFiltered={10}
        totalAll={10}
        onStatusChange={handleStatusChange}
        onEmergencyToggle={vi.fn()}
        onSearchChange={handleSearchChange}
        onPriorityChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onDateRangeChange={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/buscar por código/i)).toBeInTheDocument();
    expect(screen.getByText('Todos los Estados')).toBeInTheDocument();

    const pendingChip = screen.getByText('Pendientes');
    fireEvent.click(pendingChip);
    expect(handleStatusChange).toHaveBeenCalledWith('pendiente');
  });

  it('triggers search query callback on text input', () => {
    const handleSearchChange = vi.fn();

    render(
      <CrimeReportsFilterBar
        statusFilter=""
        isEmergencyOnly={false}
        searchQuery=""
        priorityFilter=""
        categoryIdFilter=""
        dateRangeFilter="all"
        sortField="created_at"
        sortOrder="desc"
        categories={mockCategories}
        statusCounts={{ todos: 5, pendiente: 1, en_revision: 0, en_atencion: 0, derivado: 0, resuelto: 4, archivado: 0, rechazado: 0, sos: 0 }}
        totalFiltered={5}
        totalAll={5}
        onStatusChange={vi.fn()}
        onEmergencyToggle={vi.fn()}
        onSearchChange={handleSearchChange}
        onPriorityChange={vi.fn()}
        onCategoryChange={vi.fn()}
        onDateRangeChange={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/buscar por código/i);
    fireEvent.change(input, { target: { value: 'DA-2026-001' } });
    expect(handleSearchChange).toHaveBeenCalledWith('DA-2026-001');
  });
});
