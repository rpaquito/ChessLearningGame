import { describe, expect, it } from 'vitest';
import { replayLine } from './replayLine';
import { OPENINGS } from './data';
import type { OpeningLine } from './types';

describe('replayLine', () => {
  it('replays a short line move by move, returning fen/from/to/san/explanation', () => {
    const line: OpeningLine = {
      name: 'Linha de teste',
      moves: [
        { san: 'e4', explanation: 'Ocupa o centro.' },
        { san: 'e5', explanation: 'Resposta simétrica.' },
      ],
    };

    const result = replayLine(line);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      from: 'e2',
      to: 'e4',
      promotion: undefined,
      san: 'e4',
      explanation: 'Ocupa o centro.',
    });
    expect(result[1].fen).toBe(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
    );
    expect(result[1].from).toBe('e7');
    expect(result[1].to).toBe('e5');
    expect(result[1].explanation).toBe('Resposta simétrica.');
  });

  it('throws a descriptive error for an illegal move', () => {
    const line: OpeningLine = {
      name: 'Linha inválida',
      moves: [{ san: 'e5', explanation: 'Não é um lance legal de abertura.' }],
    };

    expect(() => replayLine(line)).toThrow(/Lance ilegal/);
  });

  it('replays every line of every real opening without throwing', () => {
    for (const opening of OPENINGS) {
      for (const line of opening.lines) {
        const result = replayLine(line);
        expect(result).toHaveLength(line.moves.length);
      }
    }
  });
});
