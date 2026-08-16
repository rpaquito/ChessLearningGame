import { describe, expect, it } from 'vitest';
import { findThreatenedSquares } from './threats';

describe('findThreatenedSquares', () => {
  it('finds no threats in the starting position', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(findThreatenedSquares(fen, 'w')).toEqual([]);
  });

  it('detects a hanging pawn attacked by an enemy knight', () => {
    const fen = '4k3/8/2n5/4P3/8/8/8/4K3 b - - 0 1';
    expect(findThreatenedSquares(fen, 'w')).toEqual(['e5']);
  });

  it('detects multiple threatened pieces', () => {
    const fen = '4k3/8/2n5/4Pp2/6P1/8/8/4K3 b - - 0 1';
    expect(findThreatenedSquares(fen, 'w').sort()).toEqual(['e5', 'g4']);
  });

  it('does not throw on en-passant positions (regression test)', () => {
    const fen = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2';
    // This should not throw "Invalid FEN: illegal en-passant square"
    expect(() => findThreatenedSquares(fen, 'w')).not.toThrow();
    // In this position, no white pieces are actually hanging
    expect(findThreatenedSquares(fen, 'w')).toEqual([]);
  });
});
