import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommunityFilterBar } from '../CommunityFilterBar';

const mockCategories = [
  {
    id: 'cat-urbano',
    name: 'Alumbrado Público',
    slug: 'alumbrado-publico',
    applicable_type: 'reporte_comunitario' as const,
    is_emergency_default: false,
    sort_order: 1,
  },
];

describe('CommunityFilterBar component', () => {
  it('renders search input, categories and triggers status change', () => {
    const handleStatusFilterChange = vi.fn();
    const handleSearchChange = vi.fn();

    render(
      <CommunityFilterBar
        searchQuery=""
        onSearchChange={handleSearchChange}
        categories={mockCategories}
        categoryIdFilter=""
        onCategoryFilterChange={vi.fn()}
        priorityFilter=""
        onPriorityFilterChange={vi.fn()}
        dateRangeFilter="all"
        onDateRangeFilterChange={vi.fn()}
        statusFilter=""
        onStatusFilterChange={handleStatusFilterChange}
        statusCounts={{ todos: 8, pendiente: 2, en_revision: 1, derivado: 2, en_atencion: 1, resuelto: 2, archivado: 0, rechazado: 0 }}
        totalFiltered={8}
        totalCount={8}
        sortField="created_at"
        sortOrder="desc"
      />
    );

    expect(screen.getByPlaceholderText(/buscar código/i)).toBeInTheDocument();
    expect(screen.getByText('Todos los Reportes')).toBeInTheDocument();

    const derivadoChip = screen.getByText('Derivados');
    fireEvent.click(derivadoChip);
    expect(handleStatusFilterChange).toHaveBeenCalledWith('derivado');
  });
});
