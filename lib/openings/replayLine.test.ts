import { describe, expect, it } from 'vitest';
import { replayLine } from './replayLine';
import { OPENINGS } from './data';
import type { OpeningLine } from './types';

describe('replayLine', () => {
  it('replays a short line move by move, returning fen/from/to/san/explanation', () => {
    const line: OpeningLine = {
      name: { pt: 'Linha de teste', en: 'Test line' },
      moves: [
        { san: 'e4', explanation: { pt: 'Ocupa o centro.', en: 'Occupies the center.' } },
        { san: 'e5', explanation: { pt: 'Resposta simétrica.', en: 'Symmetric response.' } },
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
      explanation: { pt: 'Ocupa o centro.', en: 'Occupies the center.' },
    });
    expect(result[1].fen).toBe(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
    );
    expect(result[1].from).toBe('e7');
    expect(result[1].to).toBe('e5');
    expect(result[1].explanation).toEqual({ pt: 'Resposta simétrica.', en: 'Symmetric response.' });
  });

  it('throws a descriptive error for an illegal move', () => {
    const line: OpeningLine = {
      name: { pt: 'Linha inválida', en: 'Invalid line' },
      moves: [
        {
          san: 'e5',
          explanation: { pt: 'Não é um lance legal de abertura.', en: 'Not a legal opening move.' },
        },
      ],
    };

    expect(() => replayLine(line)).toThrow(/Lance ilegal/);
  });

  it('populates the promotion field for a promoting move', () => {
    // Nenhuma linha real de OPENINGS chega a promover (são todas de
    // abertura) — linha sintética só para exercitar o campo, que nunca
    // tinha teste próprio (ver backlog).
    const line: OpeningLine = {
      name: { pt: 'Linha de promoção (teste)', en: 'Promotion line (test)' },
      moves: [
        { san: 'a4', explanation: { pt: '', en: '' } },
        { san: 'e6', explanation: { pt: '', en: '' } },
        { san: 'a5', explanation: { pt: '', en: '' } },
        { san: 'e5', explanation: { pt: '', en: '' } },
        { san: 'a6', explanation: { pt: '', en: '' } },
        { san: 'e4', explanation: { pt: '', en: '' } },
        { san: 'axb7', explanation: { pt: '', en: '' } },
        { san: 'e3', explanation: { pt: '', en: '' } },
        {
          san: 'bxa8=Q',
          explanation: {
            pt: 'Promove o peão a dama, capturando a torre.',
            en: 'Promotes the pawn to a queen, capturing the rook.',
          },
        },
      ],
    };

    const result = replayLine(line);
    const promotingMove = result[result.length - 1];

    expect(promotingMove.san).toBe('bxa8=Q');
    expect(promotingMove.from).toBe('b7');
    expect(promotingMove.to).toBe('a8');
    expect(promotingMove.promotion).toBe('q');
  });

  it('gives the king its own from/to on castling, with no separate rook field', () => {
    const line: OpeningLine = {
      name: { pt: 'Linha de roque (teste)', en: 'Castling line (test)' },
      moves: [
        { san: 'e4', explanation: { pt: '', en: '' } },
        { san: 'e5', explanation: { pt: '', en: '' } },
        { san: 'Nf3', explanation: { pt: '', en: '' } },
        { san: 'Nc6', explanation: { pt: '', en: '' } },
        { san: 'Bc4', explanation: { pt: '', en: '' } },
        { san: 'Bc5', explanation: { pt: '', en: '' } },
        { san: 'O-O', explanation: { pt: 'Roca.', en: 'Castles.' } },
      ],
    };

    const result = replayLine(line);
    const castlingMove = result[result.length - 1];

    expect(castlingMove.san).toBe('O-O');
    expect(castlingMove.from).toBe('e1');
    expect(castlingMove.to).toBe('g1');
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
