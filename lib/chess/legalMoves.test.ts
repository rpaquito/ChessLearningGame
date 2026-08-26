import { describe, expect, it } from 'vitest';
import { legalTargetsFrom, forceTurnFor, checkedKingSquare } from './legalMoves';

describe('legalTargetsFrom', () => {
  it('lists legal destination squares for a piece', () => {
    const fen = '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1';
    expect(legalTargetsFrom(fen, 'e2').sort()).toEqual(['e3', 'e4']);
  });
});

describe('forceTurnFor', () => {
  it('forces the turn field back to the given color', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    expect(forceTurnFor(fen, 'w')).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
  });

  it('also works forcing back to black, for a black-piece demo', () => {
    const fen = '4k3/8/8/8/8/8/8/3R3K w - - 0 1';
    expect(forceTurnFor(fen, 'b')).toBe('4k3/8/8/8/8/8/8/3R3K b - - 0 1');
  });
});

describe('checkedKingSquare', () => {
  it('returns null when nobody is in check', () => {
    expect(checkedKingSquare('4k3/8/8/8/8/8/8/4K3 w - - 0 1')).toBeNull();
  });

  it("finds the side-to-move's king when it is in check", () => {
    // Rook on e1 checks the black king on e8, black to move.
    expect(checkedKingSquare('4k3/8/8/8/8/8/8/4R2K b - - 0 1')).toBe('e8');
  });
});
