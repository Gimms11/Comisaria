import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button component', () => {
  it('renders button with label and responds to click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Enviar Denuncia</Button>);

    const button = screen.getByRole('button', { name: /enviar denuncia/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner and disables click when isLoading is true', () => {
    const handleClick = vi.fn();
    render(<Button isLoading onClick={handleClick}>Guardar</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="danger">Eliminar</Button>);
    let button = screen.getByRole('button', { name: /eliminar/i });
    expect(button.className).toContain('bg-red-600');

    rerender(<Button variant="outline">Cancelar</Button>);
    button = screen.getByRole('button', { name: /cancelar/i });
    expect(button.className).toContain('border');
  });
});
