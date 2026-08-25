import { describe, expect, it } from 'vitest';
import { describeMove, explainMoveQuality } from './moveExplanation';

describe('describeMove', () => {
  it('describes a capture, naming the piece and the square', () => {
    const fen = '4k3/8/4p3/8/3N4/8/8/4K3 w - - 0 10';
    expect(describeMove(fen, { from: 'd4', to: 'e6' })).toBe('Captura o peão em e6.');
  });

  it('describes a check', () => {
    const fen = '3k4/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'd7' })).toBe('Dá xeque.');
  });

  it('describes checkmate, overriding every other tag', () => {
    const fen = '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1';
    expect(describeMove(fen, { from: 'a1', to: 'a8' })).toBe('Dá xeque-mate.');
  });

  it('describes a promotion, naming the square', () => {
    const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';
    expect(describeMove(fen, { from: 'e7', to: 'e8', promotion: 'q' })).toBe(
      'Promove o peão a dama em e8.'
    );
  });

  it('describes kingside castling', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'g1' })).toBe(
      'Coloca o rei em segurança com o roque pequeno.'
    );
  });

  it('describes queenside castling', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'c1' })).toBe(
      'Coloca o rei em segurança com o roque grande.'
    );
  });

  it('describes escaping a threatened piece, naming the piece', () => {
    const fen = '3rk3/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'a1' })).toBe('Afasta a torre de uma ameaça.');
  });

  it('describes occupying the center, naming the square', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e2', to: 'e4' })).toBe('Ocupa o centro em e4.');
  });

  it('describes developing a minor piece in the opening, naming the piece', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'b1', to: 'c3' })).toBe('Desenvolve o cavalo.');
  });

  it('combines a capture with a check', () => {
    const fen = '3k4/8/2p5/N7/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'a5', to: 'c6' })).toBe('Captura o peão em c6 e dá xeque.');
  });

  it('falls back to naming the piece and destination when nothing else applies', () => {
    const fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'e2' })).toBe('Move o rei para e2.');
  });

  it('throws for an illegal move', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(() => describeMove(fen, { from: 'e2', to: 'e5' })).toThrow();
  });
});

describe('explainMoveQuality', () => {
  it('returns just the tag sentence for a good move', () => {
    expect(explainMoveQuality('boa', 'Desenvolve o cavalo.', 10)).toBe('Desenvolve o cavalo.');
  });

  it('appends the centipawn loss and a plain-language feel for an imprecision', () => {
    expect(explainMoveQuality('imprecisao', 'Ocupa o centro em e4.', 45)).toBe(
      'Ocupa o centro em e4. Havia uma jogada melhor: perdeste cerca de 45 centipawns de ' +
        'vantagem (menos do que um peão).'
    );
  });

  it('appends the centipawn loss and a plain-language feel for a mistake', () => {
    expect(explainMoveQuality('erro', 'Move o rei para e2.', 250)).toBe(
      'Move o rei para e2. Foi um erro: perdeste cerca de 250 centipawns de vantagem ' +
        '(cerca de um peão).'
    );
  });

  it('describes a large loss as worth more than a minor piece', () => {
    expect(explainMoveQuality('erro', 'Move o rei para e2.', 400)).toBe(
      'Move o rei para e2. Foi um erro: perdeste cerca de 400 centipawns de vantagem ' +
        '(cerca de uma peça menor, como um cavalo ou bispo).'
    );
  });

  it('describes a very large loss as worth more than a queen', () => {
    expect(explainMoveQuality('erro', 'Move o rei para e2.', 950)).toBe(
      'Move o rei para e2. Foi um erro: perdeste cerca de 950 centipawns de vantagem ' +
        '(mais do que uma dama).'
    );
  });
});
