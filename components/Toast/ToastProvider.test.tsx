import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from './ToastProvider';
import { useToast } from './ToastProvider';

function Trigger({ message, tone }: { message: string; tone?: 'info' | 'check' }) {
  const { show } = useToast();
  return (
    <button type="button" onClick={() => show(message, tone)}>
      trigger: {message}
    </button>
  );
}

function BadConsumer() {
  useToast();
  return null;
}

describe('ToastProvider / useToast', () => {
  it('renders no toast initially', () => {
    render(
      <ToastProvider>
        <Trigger message="Xeque!" />
      </ToastProvider>
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a toast when show() is called', () => {
    render(
      <ToastProvider>
        <Trigger message="Xeque!" tone="check" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('trigger: Xeque!'));
    expect(screen.getByRole('status')).toHaveTextContent('Xeque!');
  });

  it('replaces the current toast instantly instead of queueing', () => {
    render(
      <ToastProvider>
        <Trigger message="Xeque!" tone="check" />
        <Trigger message="Tema alterado." tone="info" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('trigger: Xeque!'));
    fireEvent.click(screen.getByText('trigger: Tema alterado.'));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Tema alterado.');
  });

  it('dismisses the toast via its own close button', () => {
    render(
      <ToastProvider>
        <Trigger message="Xeque!" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('trigger: Xeque!'));
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('throws when useToast() is called outside a ToastProvider', () => {
    expect(() => render(<BadConsumer />)).toThrow(
      'useToast() só pode ser usado dentro de <ToastProvider>.'
    );
  });
});
