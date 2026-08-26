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
  name: 'Abertura de Teste',
  description: 'Linha curta só para testes.',
  lines: [
    {
      name: 'Linha única',
      moves: [
        { san: 'e4', explanation: 'Ocupa o centro.' },
        { san: 'e5', explanation: 'Resposta simétrica.' },
      ],
    },
  ],
};

function clickSquare(container: HTMLElement, square: string) {
  const button = container.querySelector(`[data-square="${square}"]`) as HTMLButtonElement;
  fireEvent.click(button);
}

describe('OpeningPractice', () => {
  it('is interactive on the user\'s first turn (White protagonist) and accepts the correct move', () => {
    const { container } = render(<OpeningPractice opening={italiana} />);
    expect(screen.getByText('A tua vez: encontra o lance da linha.')).toBeInTheDocument();

    clickSquare(container, 'e2');
    clickSquare(container, 'e4');

    expect(screen.queryByText('A tua vez: encontra o lance da linha.')).not.toBeInTheDocument();
    expect(screen.getByText('A pensar…')).toBeInTheDocument();
  });

  it('rejects a legal-but-wrong move and reveals the expected one', () => {
    const { container } = render(<OpeningPractice opening={italiana} />);

    clickSquare(container, 'e2');
    clickSquare(container, 'e3');

    expect(
      screen.getByText('Não é esse — o lance da linha era e4. Tenta de novo.')
    ).toBeInTheDocument();
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
