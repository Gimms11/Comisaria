import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GuideAdminCard } from '../GuideAdminCard';
import { GuideItem } from '../../../types';

const mockGuide: GuideItem = {
  id: 'guide-1',
  title: 'Cómo tramitar copia certificada',
  slug: 'como-tramitar-copia',
  summary: 'Pasos detallados para solicitar constancia en comisaría',
  sort_order: 1,
  content_type: 'video',
  is_published: true,
  is_featured: false,
  view_count: 150,
  helpful_count: 24,
  duration_seconds: 45,
  resources: [],
  created_at: '2026-03-01T12:00:00Z',
  updated_at: '2026-03-01T12:00:00Z',
};

describe('GuideAdminCard component', () => {
  it('renders guide title, summary and views count', () => {
    render(
      <GuideAdminCard
        guide={mockGuide}
        onTogglePublish={vi.fn()}
      />
    );

    expect(screen.getByText('Cómo tramitar copia certificada')).toBeInTheDocument();
    expect(screen.getByText('Pasos detallados para solicitar constancia en comisaría')).toBeInTheDocument();
    expect(screen.getByText(/150 vistas/i)).toBeInTheDocument();
  });

  it('triggers onTogglePublish when publish toggle button is clicked', () => {
    const handleToggle = vi.fn();
    render(
      <GuideAdminCard
        guide={mockGuide}
        onTogglePublish={handleToggle}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /ocultar/i });
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledWith(mockGuide);
  });
});
