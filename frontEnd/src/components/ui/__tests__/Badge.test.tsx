import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../Badge';

describe('Badge component', () => {
  it('renders children text correctly', () => {
    render(<Badge>Urgente</Badge>);
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });

  it('applies pulse animation class when pulse prop is true', () => {
    const { container } = render(<Badge variant="urgent" pulse>SOS</Badge>);
    expect(container.firstChild).toHaveClass('radar-emergency');
  });

  it('renders with success variant', () => {
    const { container } = render(<Badge variant="success">Resuelto</Badge>);
    expect(container.firstChild).toHaveClass('text-emerald-400');
  });
});
