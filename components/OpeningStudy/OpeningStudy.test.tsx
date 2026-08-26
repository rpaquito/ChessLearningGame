import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { OpeningStudy } from './OpeningStudy';
import { OPENINGS } from '@/lib/openings/data';

const italiana = OPENINGS.find((o) => o.id === 'abertura-italiana')!;

describe('OpeningStudy', () => {
  it('starts at the initial position with "Anterior" disabled', () => {
    render(<OpeningStudy opening={italiana} />);
    expect(screen.getByText(/Posição inicial/)).toBeInTheDocument();
    expect(screen.getByText('0 / 9')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  });

  it('advances one move per "Seguinte" click, with correct move labels', () => {
    render(<OpeningStudy opening={italiana} />);
    const next = screen.getByRole('button', { name: 'Seguinte' });

    fireEvent.click(next);
    expect(screen.getByText('1. e4')).toBeInTheDocument();
    expect(screen.getByText('Ocupa o centro e abre linha para o bispo e a dama.')).toBeInTheDocument();

    fireEvent.click(next);
    expect(screen.getByText('1...e5')).toBeInTheDocument();
    expect(
      screen.getByText('Resposta simétrica: também disputa o centro imediatamente.')
    ).toBeInTheDocument();
  });

  it('disables "Seguinte" at the last move and does not overshoot on extra clicks', () => {
    render(<OpeningStudy opening={italiana} />);
    const next = screen.getByRole('button', { name: 'Seguinte' });

    for (let i = 0; i < 9; i++) fireEvent.click(next);
    expect(screen.getByText('5. d3')).toBeInTheDocument();
    expect(screen.getByText('9 / 9')).toBeInTheDocument();
    expect(next).toBeDisabled();

    fireEvent.click(next);
    expect(screen.getByText('9 / 9')).toBeInTheDocument();
  });

  it('steps back with "Anterior"', () => {
    render(<OpeningStudy opening={italiana} />);
    const next = screen.getByRole('button', { name: 'Seguinte' });
    const prev = screen.getByRole('button', { name: 'Anterior' });

    for (let i = 0; i < 9; i++) fireEvent.click(next);
    fireEvent.click(prev);

    expect(screen.getByText('4...Nf6')).toBeInTheDocument();
    expect(screen.getByText('8 / 9')).toBeInTheDocument();
  });

  it('switching lines resets to the initial position and shows that line\'s own moves', () => {
    render(<OpeningStudy opening={italiana} />);
    const next = screen.getByRole('button', { name: 'Seguinte' });

    for (let i = 0; i < 6; i++) fireEvent.click(next);
    expect(screen.getByText('3...Bc5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Gambito Evans' }));
    expect(screen.getByText(/Posição inicial/)).toBeInTheDocument();
    expect(screen.getByText('0 / 9')).toBeInTheDocument();

    for (let i = 0; i < 7; i++) fireEvent.click(next);
    expect(screen.getByText('4. b4')).toBeInTheDocument();
    expect(
      screen.getByText('O Gambito Evans: sacrifica um peão para ganhar tempo e um centro forte.')
    ).toBeInTheDocument();
  });
});
