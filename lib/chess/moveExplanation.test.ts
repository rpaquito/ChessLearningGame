import { describe, expect, it } from 'vitest';
import { describeMove, explainMoveQuality } from './moveExplanation';

describe('describeMove', () => {
  it('describes a capture', () => {
    const fen = '4k3/8/4p3/8/3N4/8/8/4K3 w - - 0 10';
    expect(describeMove(fen, { from: 'd4', to: 'e6' })).toBe('Captura o peão.');
  });

  it('describes a check', () => {
    const fen = '3k4/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'd7' })).toBe('Dá xeque.');
  });

  it('describes checkmate, overriding every other tag', () => {
    const fen = '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1';
    expect(describeMove(fen, { from: 'a1', to: 'a8' })).toBe('Dá xeque-mate.');
  });

  it('describes a promotion', () => {
    const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';
    expect(describeMove(fen, { from: 'e7', to: 'e8', promotion: 'q' })).toBe('Promove o peão a dama.');
  });

  it('describes kingside castling', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'g1' })).toBe('Coloca o rei em segurança com o roque.');
  });

  it('describes escaping a threatened piece', () => {
    const fen = '3rk3/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'a1' })).toBe('Foge de uma peça ameaçada.');
  });

  it('describes occupying the center', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e2', to: 'e4' })).toBe('Ocupa uma casa central.');
  });

  it('describes developing a minor piece in the opening', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'b1', to: 'c3' })).toBe('Desenvolve uma peça.');
  });

  it('combines a capture with a check', () => {
    const fen = '3k4/8/2p5/N7/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'a5', to: 'c6' })).toBe('Captura o peão e dá xeque.');
  });

  it('falls back to a generic positional description', () => {
    const fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'e2' })).toBe('É um lance posicional.');
  });

  it('throws for an illegal move', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(() => describeMove(fen, { from: 'e2', to: 'e5' })).toThrow();
  });
});

describe('explainMoveQuality', () => {
  it('returns just the tag sentence for a good move', () => {
    expect(explainMoveQuality('boa', 'Desenvolve uma peça.', 10)).toBe('Desenvolve uma peça.');
  });

  it('appends the centipawn loss for an imprecision', () => {
    expect(explainMoveQuality('imprecisao', 'Ocupa uma casa central.', 45)).toBe(
      'Ocupa uma casa central. Havia uma jogada melhor: perdeste cerca de 45 centipawns de vantagem.'
    );
  });

  it('appends the centipawn loss for a mistake', () => {
    expect(explainMoveQuality('erro', 'É um lance posicional.', 250)).toBe(
      'É um lance posicional. Foi um erro: perdeste cerca de 250 centipawns de vantagem.'
    );
  });
});
