import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastProvider';

function Trigger({ message, tone }: { message: string; tone?: 'info' | 'check' }) {
  const { show } = useToast();
  return (
    <button type="button" onClick={() => show(message, tone)}>
      trigger: {message}
    </button>
  );
}

function TriggerWithDismiss({ message }: { message: string }) {
  const { show, dismiss } = useToast();
  return (
    <>
      <button type="button" onClick={() => show(message)}>
        trigger: {message}
      </button>
      <button type="button" onClick={dismiss}>
        dismiss from consumer
      </button>
    </>
  );
}

function BadConsumer() {
  useToast();
  return null;
}

describe('ToastProvider / useToast', () => {
  it('renders no toast card initially', () => {
    render(
      <ToastProvider>
        <Trigger message="Xeque!" />
      </ToastProvider>
    );
    // O wrapper role="status" fica sempre montado (ver Toast.tsx) — o que
    // não existe antes de show() é o cartão/mensagem/botão lá dentro.
    expect(screen.queryByTestId('toast-card')).not.toBeInTheDocument();
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
    expect(screen.queryByTestId('toast-card')).not.toBeInTheDocument();
  });

  it('dismisses the toast when a consumer calls the exposed dismiss()', () => {
    render(
      <ToastProvider>
        <TriggerWithDismiss message="Xeque!" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('trigger: Xeque!'));
    expect(screen.getByRole('status')).toHaveTextContent('Xeque!');
    fireEvent.click(screen.getByText('dismiss from consumer'));
    expect(screen.queryByTestId('toast-card')).not.toBeInTheDocument();
  });

  it('throws when useToast() is called outside a ToastProvider', () => {
    expect(() => render(<BadConsumer />)).toThrow(
      'useToast() só pode ser usado dentro de <ToastProvider>.'
    );
  });
});
