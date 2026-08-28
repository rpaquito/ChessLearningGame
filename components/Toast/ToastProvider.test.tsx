import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastProvider';

afterEach(() => {
  vi.useRealTimers();
});

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

  it('gives each toast a unique id even when shown back to back, so an identical repeated message still remounts (and re-announces)', () => {
    render(
      <ToastProvider>
        <Trigger message="Dificuldade por omissão alterada." tone="info" />
      </ToastProvider>
    );
    fireEvent.click(screen.getByText('trigger: Dificuldade por omissão alterada.'));
    const firstCard = screen.getByTestId('toast-card');
    fireEvent.click(screen.getByText('trigger: Dificuldade por omissão alterada.'));
    const secondCard = screen.getByTestId('toast-card');
    expect(secondCard).not.toBe(firstCard);
  });

  it('throws when useToast() is called outside a ToastProvider', () => {
    expect(() => render(<BadConsumer />)).toThrow(
      'useToast() só pode ser usado dentro de <ToastProvider>.'
    );
  });

  it('exposes the current toast state via useToast()', () => {
    function Reader() {
      const { toast, show } = useToast();
      return (
        <>
          <button type="button" onClick={() => show('Idioma alterado.', 'info')}>
            trigger
          </button>
          <p data-testid="reader">{toast ? `${toast.tone}:${toast.message}` : 'none'}</p>
        </>
      );
    }
    render(
      <ToastProvider>
        <Reader />
      </ToastProvider>
    );
    expect(screen.getByTestId('reader')).toHaveTextContent('none');
    fireEvent.click(screen.getByText('trigger'));
    expect(screen.getByTestId('reader')).toHaveTextContent('info:Idioma alterado.');
  });

  it('auto-dismisses an "info" toast after 4 seconds if nobody closes it', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger message="Tema alterado." tone="info" />
      </ToastProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('trigger: Tema alterado.'));
    });
    expect(screen.getByTestId('toast-card')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByTestId('toast-card')).not.toBeInTheDocument();
  });

  it('never auto-dismisses a "check" toast, even long after it appears', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger message="Xeque!" tone="check" />
      </ToastProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('trigger: Xeque!'));
    });

    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByTestId('toast-card')).toBeInTheDocument();
  });

  it('resets the auto-dismiss timer when a new toast replaces the current one', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger message="Dificuldade alterada." tone="info" />
        <Trigger message="Cor alterada." tone="info" />
      </ToastProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('trigger: Dificuldade alterada.'));
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => {
      fireEvent.click(screen.getByText('trigger: Cor alterada.'));
    });
    // 3s (already elapsed for the first toast) + 3s more = 6s total, but
    // only 3s since the SECOND toast appeared — if the timer didn't
    // reset, the first toast's stale timeout would fire here and wipe
    // out the second toast too early.
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Cor alterada.');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByTestId('toast-card')).not.toBeInTheDocument();
  });

  it('clears the pending auto-dismiss timer when the toast is closed manually', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger message="Tema alterado." tone="info" />
      </ToastProvider>
    );
    act(() => {
      fireEvent.click(screen.getByText('trigger: Tema alterado.'));
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    });
    expect(screen.queryByTestId('toast-card')).not.toBeInTheDocument();

    // Se o temporizador antigo não tivesse sido limpo, isto não teria
    // nenhum toast para apagar — mas confirma pelo menos que nada
    // rebenta ao deixar o tempo passar depois de um fecho manual.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByTestId('toast-card')).not.toBeInTheDocument();
  });
});
