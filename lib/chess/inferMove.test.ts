import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { inferMove } from './inferMove';

function fenAfter(startFen: string | undefined, moves: string[]) {
  const chess = startFen ? new Chess(startFen) : new Chess();
  for (const move of moves.slice(0, -1)) chess.move(move);
  const prevFen = chess.fen();
  chess.move(moves[moves.length - 1]);
  const nextFen = chess.fen();
  return { prevFen, nextFen };
}

describe('inferMove', () => {
  it('detects a normal move', () => {
    const { prevFen, nextFen } = fenAfter(undefined, ['e4']);
    expect(inferMove(prevFen, nextFen)).toEqual({
      from: 'e2',
      to: 'e4',
    });
  });

  it('detects a capture and marks the captured square', () => {
    const { prevFen, nextFen } = fenAfter(undefined, ['e4', 'd5', 'exd5']);
    expect(inferMove(prevFen, nextFen)).toEqual({
      from: 'e4',
      to: 'd5',
      capturedSquare: 'd5',
    });
  });

  it('detects en passant and marks the captured pawn under the destination', () => {
    const { prevFen, nextFen } = fenAfter(undefined, ['e4', 'a6', 'e5', 'd5', 'exd6']);
    expect(inferMove(prevFen, nextFen)).toEqual({
      from: 'e5',
      to: 'd6',
      capturedSquare: 'd5',
    });
  });

  it('detects kingside castling and includes the rook move', () => {
    const { prevFen, nextFen } = fenAfter(undefined, [
      'e4',
      'e5',
      'Nf3',
      'Nc6',
      'Bc4',
      'Bc5',
      'O-O',
    ]);
    expect(inferMove(prevFen, nextFen)).toEqual({
      from: 'e1',
      to: 'g1',
      castleRookFrom: 'h1',
      castleRookTo: 'f1',
    });
  });

  it('detects queenside castling and includes the rook move', () => {
    const { prevFen, nextFen } = fenAfter(undefined, [
      'd4',
      'd5',
      'Nc3',
      'Nc6',
      'Bf4',
      'Bf5',
      'Qd2',
      'Qd7',
      'O-O-O',
    ]);
    expect(inferMove(prevFen, nextFen)).toEqual({
      from: 'e1',
      to: 'c1',
      castleRookFrom: 'a1',
      castleRookTo: 'd1',
    });
  });

  it('detects promotion and includes the promoted piece type', () => {
    const { prevFen, nextFen } = fenAfter('7k/4P3/8/8/8/8/8/4K3 w - - 0 1', ['e8=Q']);
    expect(inferMove(prevFen, nextFen)).toEqual({
      from: 'e7',
      to: 'e8',
      promotion: 'q',
    });
  });

  it('returns null when no legal move connects the two positions', () => {
    const prevFen = new Chess().fen();
    const unrelatedFen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    expect(inferMove(prevFen, unrelatedFen)).toBeNull();
  });
});
