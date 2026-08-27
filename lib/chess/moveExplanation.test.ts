import { describe, expect, it } from 'vitest';
import { describeMove, explainMoveQuality } from './moveExplanation';

describe('describeMove — pt', () => {
  it('describes a capture, naming the piece and the square', () => {
    const fen = '4k3/8/4p3/8/3N4/8/8/4K3 w - - 0 10';
    expect(describeMove(fen, { from: 'd4', to: 'e6' }, 'pt')).toBe('Captura o peão em e6.');
  });

  it('describes a check', () => {
    const fen = '3k4/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'd7' }, 'pt')).toBe('Dá xeque.');
  });

  it('describes checkmate, overriding every other tag', () => {
    const fen = '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1';
    expect(describeMove(fen, { from: 'a1', to: 'a8' }, 'pt')).toBe('Dá xeque-mate.');
  });

  it('describes a promotion, naming the square', () => {
    const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';
    expect(describeMove(fen, { from: 'e7', to: 'e8', promotion: 'q' }, 'pt')).toBe(
      'Promove o peão a dama em e8.'
    );
  });

  it('describes kingside castling', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'g1' }, 'pt')).toBe(
      'Coloca o rei em segurança com o roque pequeno.'
    );
  });

  it('describes queenside castling', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'c1' }, 'pt')).toBe(
      'Coloca o rei em segurança com o roque grande.'
    );
  });

  it('describes escaping a threatened piece, naming the piece', () => {
    const fen = '3rk3/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'a1' }, 'pt')).toBe('Afasta a torre de uma ameaça.');
  });

  it('describes occupying the center, naming the square', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e2', to: 'e4' }, 'pt')).toBe('Ocupa o centro em e4.');
  });

  it('describes developing a minor piece in the opening, naming the piece', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'b1', to: 'c3' }, 'pt')).toBe('Desenvolve o cavalo.');
  });

  it('combines a capture with a check', () => {
    const fen = '3k4/8/2p5/N7/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'a5', to: 'c6' }, 'pt')).toBe('Captura o peão em c6 e dá xeque.');
  });

  it('falls back to naming the piece and destination when nothing else applies', () => {
    const fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'e2' }, 'pt')).toBe('Move o rei para e2.');
  });

  it('throws for an illegal move', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(() => describeMove(fen, { from: 'e2', to: 'e5' }, 'pt')).toThrow();
  });
});

describe('describeMove — en', () => {
  it('describes a capture, naming the piece and the square', () => {
    const fen = '4k3/8/4p3/8/3N4/8/8/4K3 w - - 0 10';
    expect(describeMove(fen, { from: 'd4', to: 'e6' }, 'en')).toBe('Captures the pawn on e6.');
  });

  it('describes a check', () => {
    const fen = '3k4/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'd7' }, 'en')).toBe('Gives check.');
  });

  it('describes checkmate, overriding every other tag', () => {
    const fen = '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1';
    expect(describeMove(fen, { from: 'a1', to: 'a8' }, 'en')).toBe('Delivers checkmate.');
  });

  it('describes a promotion, naming the square', () => {
    const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';
    expect(describeMove(fen, { from: 'e7', to: 'e8', promotion: 'q' }, 'en')).toBe(
      'Promotes the pawn to a queen on e8.'
    );
  });

  it('describes kingside castling', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'g1' }, 'en')).toBe('Castles kingside.');
  });

  it('describes queenside castling', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'c1' }, 'en')).toBe('Castles queenside.');
  });

  it('describes escaping a threatened piece, naming the piece', () => {
    const fen = '3rk3/8/8/8/8/8/8/3RK3 w - - 0 1';
    expect(describeMove(fen, { from: 'd1', to: 'a1' }, 'en')).toBe(
      'Moves the rook away from a threat.'
    );
  });

  it('describes occupying the center, naming the square', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'e2', to: 'e4' }, 'en')).toBe('Occupies the center on e4.');
  });

  it('describes developing a minor piece in the opening, naming the piece', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(describeMove(fen, { from: 'b1', to: 'c3' }, 'en')).toBe('Develops the knight.');
  });

  it('combines a capture with a check', () => {
    const fen = '3k4/8/2p5/N7/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'a5', to: 'c6' }, 'en')).toBe(
      'Captures the pawn on c6 and gives check.'
    );
  });

  it('falls back to naming the piece and destination when nothing else applies', () => {
    const fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    expect(describeMove(fen, { from: 'e1', to: 'e2' }, 'en')).toBe('Moves the king to e2.');
  });
});

describe('explainMoveQuality — pt', () => {
  it('returns just the tag sentence for a good move', () => {
    expect(explainMoveQuality('boa', 'Desenvolve o cavalo.', 10, 'pt')).toBe('Desenvolve o cavalo.');
  });

  it('appends the centipawn loss and a plain-language feel for an imprecision', () => {
    expect(explainMoveQuality('imprecisao', 'Ocupa o centro em e4.', 45, 'pt')).toBe(
      'Ocupa o centro em e4. Havia uma jogada melhor: perdeste cerca de 45 centipawns de ' +
        'vantagem (menos do que um peão).'
    );
  });

  it('appends the centipawn loss and a plain-language feel for a mistake', () => {
    expect(explainMoveQuality('erro', 'Move o rei para e2.', 250, 'pt')).toBe(
      'Move o rei para e2. Foi um erro: perdeste cerca de 250 centipawns de vantagem ' +
        '(cerca de um peão).'
    );
  });

  it('describes a large loss as worth more than a minor piece', () => {
    expect(explainMoveQuality('erro', 'Move o rei para e2.', 400, 'pt')).toBe(
      'Move o rei para e2. Foi um erro: perdeste cerca de 400 centipawns de vantagem ' +
        '(cerca de uma peça menor, como um cavalo ou bispo).'
    );
  });

  it('describes a very large loss as worth more than a queen', () => {
    expect(explainMoveQuality('erro', 'Move o rei para e2.', 950, 'pt')).toBe(
      'Move o rei para e2. Foi um erro: perdeste cerca de 950 centipawns de vantagem ' +
        '(mais do que uma dama).'
    );
  });

  it('describes a loss as worth about a rook', () => {
    expect(explainMoveQuality('erro', 'Move o rei para e2.', 600, 'pt')).toBe(
      'Move o rei para e2. Foi um erro: perdeste cerca de 600 centipawns de vantagem ' +
        '(cerca de uma torre).'
    );
  });
});

describe('explainMoveQuality — en', () => {
  it('returns just the tag sentence for a good move', () => {
    expect(explainMoveQuality('boa', 'Develops the knight.', 10, 'en')).toBe('Develops the knight.');
  });

  it('appends the centipawn loss and a plain-language feel for an imprecision', () => {
    expect(explainMoveQuality('imprecisao', 'Occupies the center on e4.', 45, 'en')).toBe(
      'Occupies the center on e4. There was a better move: you lost about 45 centipawns of ' +
        'advantage (less than a pawn).'
    );
  });

  it('appends the centipawn loss and a plain-language feel for a mistake', () => {
    expect(explainMoveQuality('erro', 'Moves the king to e2.', 250, 'en')).toBe(
      'Moves the king to e2. That was a mistake: you lost about 250 centipawns of advantage ' +
        '(about a pawn).'
    );
  });

  it('describes a large loss as worth more than a minor piece', () => {
    expect(explainMoveQuality('erro', 'Moves the king to e2.', 400, 'en')).toBe(
      'Moves the king to e2. That was a mistake: you lost about 400 centipawns of advantage ' +
        '(about a minor piece, like a knight or bishop).'
    );
  });

  it('describes a very large loss as worth more than a queen', () => {
    expect(explainMoveQuality('erro', 'Moves the king to e2.', 950, 'en')).toBe(
      'Moves the king to e2. That was a mistake: you lost about 950 centipawns of advantage ' +
        '(more than a queen).'
    );
  });

  it('describes a loss as worth about a rook', () => {
    expect(explainMoveQuality('erro', 'Moves the king to e2.', 600, 'en')).toBe(
      'Moves the king to e2. That was a mistake: you lost about 600 centipawns of advantage ' +
        '(about a rook).'
    );
  });
});
