import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders nothing when toast is null', () => {
    render(<Toast toast={null} onDismiss={() => {}} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders the message when a toast is given', () => {
    render(<Toast toast={{ id: 1, message: 'Xeque!', tone: 'check' }} onDismiss={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Xeque!');
  });

  it('applies a gold accent for the "check" tone', () => {
    render(<Toast toast={{ id: 1, message: 'Xeque!', tone: 'check' }} onDismiss={() => {}} />);
    expect(screen.getByRole('status').className).toContain('border-gold');
  });

  it('applies a cyan accent for the "info" tone', () => {
    render(<Toast toast={{ id: 1, message: 'Tema alterado.', tone: 'info' }} onDismiss={() => {}} />);
    expect(screen.getByRole('status').className).toContain('border-cyan');
  });

  it('calls onDismiss when the close button is clicked', () => {
    const onDismiss = vi.fn();
    render(<Toast toast={{ id: 1, message: 'Xeque!', tone: 'check' }} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
