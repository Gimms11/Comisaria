import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../Modal';

describe('Modal component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Contenido Oculto</p>
      </Modal>
    );
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Contenido Oculto')).not.toBeInTheDocument();
  });

  it('renders title, subtitle, and children when isOpen is true', () => {
    const handleClose = vi.fn();
    render(
      <Modal
        isOpen={true}
        onClose={handleClose}
        title="Expediente Policial"
        subtitle="Detalles de la denuncia"
      >
        <p>Contenido Visible</p>
      </Modal>
    );

    expect(screen.getByText('Expediente Policial')).toBeInTheDocument();
    expect(screen.getByText('Detalles de la denuncia')).toBeInTheDocument();
    expect(screen.getByText('Contenido Visible')).toBeInTheDocument();

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
