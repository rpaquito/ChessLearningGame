import { describe, expect, it, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { OpeningPractice } from './OpeningPractice';
import { OPENINGS } from '@/lib/openings/data';
import type { Opening } from '@/lib/openings/types';

afterEach(() => {
  vi.useRealTimers();
});

const italiana = OPENINGS.find((o) => o.id === 'abertura-italiana')!;
const siciliana = OPENINGS.find((o) => o.id === 'defesa-siciliana')!;

// Linha curta e sintética, só para o teste de conclusão — evita ter de
// escrever os 9 lances reais da Italiana à mão.
const shortOpening: Opening = {
  id: 'abertura-teste',
  name: { pt: 'Abertura de Teste', en: 'Test Opening' },
  description: { pt: 'Linha curta só para testes.', en: 'Short line for tests only.' },
  lines: [
    {
      name: { pt: 'Linha única', en: 'Single line' },
      moves: [
        { san: 'e4', explanation: { pt: 'Ocupa o centro.', en: 'Occupies the center.' } },
        { san: 'e5', explanation: { pt: 'Resposta simétrica.', en: 'Symmetric response.' } },
      ],
    },
  ],
};

function clickSquare(container: HTMLElement, square: string) {
  const button = container.querySelector(`[data-square="${square}"]`) as HTMLButtonElement;
  fireEvent.click(button);
}

describe('OpeningPractice', () => {
  it('marks the turn/feedback panel as a live region so screen readers hear turn changes', () => {
    render(<OpeningPractice opening={italiana} />);
    expect(screen.getByText('A tua vez: encontra o lance da linha.').closest('[aria-live]')).toHaveAttribute(
      'aria-live',
      'polite'
    );
  });

  it('is interactive on the user\'s first turn (White protagonist) and accepts the correct move', () => {
    const { container } = render(<OpeningPractice opening={italiana} />);
    expect(screen.getByText('A tua vez: encontra o lance da linha.')).toBeInTheDocument();
    expect(container.querySelector('[data-square="e2"]')).not.toBeDisabled();

    clickSquare(container, 'e2');
    clickSquare(container, 'e4');

    expect(screen.queryByText('A tua vez: encontra o lance da linha.')).not.toBeInTheDocument();
    expect(screen.getByText('A pensar…')).toBeInTheDocument();
    expect(container.querySelector('[data-square="e2"]')).toBeDisabled();
  });

  it('rejects a legal-but-wrong move and reveals the expected one', () => {
    const { container } = render(<OpeningPractice opening={italiana} />);

    clickSquare(container, 'e2');
    clickSquare(container, 'e3');

    expect(
      screen.getByText('Não é esse — o lance da linha é e4. Tenta de novo.')
    ).toBeInTheDocument();
    expect(container.querySelector('[data-square="e4"]')).toHaveAttribute('data-suggested', 'true');
  });

  it('keeps the revealed hint visible while reselecting a piece, only clearing it once a move is played', () => {
    const { container } = render(<OpeningPractice opening={italiana} />);

    clickSquare(container, 'e2');
    clickSquare(container, 'e3');
    expect(
      screen.getByText('Não é esse — o lance da linha é e4. Tenta de novo.')
    ).toBeInTheDocument();

    // Selecionar a peça sugerida de novo (o passo natural para a
    // jogar) não pode apagar a pista antes de completar o lance — mesmo
    // padrão de app/jogar/page.tsx.
    clickSquare(container, 'e2');
    expect(
      screen.getByText('Não é esse — o lance da linha é e4. Tenta de novo.')
    ).toBeInTheDocument();

    clickSquare(container, 'e4');
    expect(
      screen.queryByText('Não é esse — o lance da linha é e4. Tenta de novo.')
    ).not.toBeInTheDocument();
  });

  it('auto-plays the opponent\'s move after a delay once the user plays correctly', () => {
    vi.useFakeTimers();
    const { container } = render(<OpeningPractice opening={italiana} />);

    clickSquare(container, 'e2');
    clickSquare(container, 'e4');
    expect(screen.getByText('A pensar…')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByText('A pensar…')).not.toBeInTheDocument();
    expect(screen.getByText('A tua vez: encontra o lance da linha.')).toBeInTheDocument();
  });

  it('auto-plays the opponent\'s first move when the user is Black (Defesa Siciliana)', () => {
    vi.useFakeTimers();
    render(<OpeningPractice opening={siciliana} />);

    expect(screen.getByText('A pensar…')).toBeInTheDocument();
    expect(screen.queryByText('A tua vez: encontra o lance da linha.')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText('A tua vez: encontra o lance da linha.')).toBeInTheDocument();
  });

  it('shows the completion card once the line is finished', () => {
    vi.useFakeTimers();
    const { container } = render(<OpeningPractice opening={shortOpening} />);

    clickSquare(container, 'e2');
    clickSquare(container, 'e4');
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText('Linha completa!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Praticar outra vez' })).toBeInTheDocument();
  });

  it('switching lines resets progress', () => {
    const { container } = render(<OpeningPractice opening={italiana} />);

    clickSquare(container, 'e2');
    clickSquare(container, 'e4');
    expect(screen.getByText('A pensar…')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Gambito Evans' }));

    expect(screen.getByText('A tua vez: encontra o lance da linha.')).toBeInTheDocument();
  });
});
