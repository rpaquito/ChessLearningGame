import { describe, expect, it } from 'vitest';
import {
  parseBestMove,
  parseScoreCp,
  parseScoreMate,
  isReadyLine,
  parseUciMove,
  parseMultiPvInfo,
} from './uciParser';

describe('parseBestMove', () => {
  it('extracts the move from a bestmove line', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toBe('e2e4');
  });

  it('returns null for lines without bestmove', () => {
    expect(parseBestMove('info depth 10 score cp 25')).toBeNull();
  });
});

describe('parseScoreCp', () => {
  it('extracts a positive centipawn score', () => {
    expect(parseScoreCp('info depth 12 score cp 34 nodes 1000')).toBe(34);
  });

  it('extracts a negative centipawn score', () => {
    expect(parseScoreCp('info depth 12 score cp -120 nodes 1000')).toBe(-120);
  });

  it('returns null when there is no score', () => {
    expect(parseScoreCp('bestmove e2e4')).toBeNull();
  });
});

describe('parseScoreMate', () => {
  it('extracts a positive mate-in-N score', () => {
    expect(parseScoreMate('info depth 12 score mate 3 nodes 1000')).toBe(3);
  });

  it('extracts a negative (being mated) score', () => {
    expect(parseScoreMate('info depth 12 score mate -2 nodes 1000')).toBe(-2);
  });

  it('returns null when there is no mate score', () => {
    expect(parseScoreMate('info depth 12 score cp 34')).toBeNull();
  });
});

describe('isReadyLine', () => {
  it('recognizes the readyok line', () => {
    expect(isReadyLine('readyok')).toBe(true);
  });

  it('rejects other lines', () => {
    expect(isReadyLine('uciok')).toBe(false);
  });
});

describe('parseMultiPvInfo', () => {
  it('extracts the multipv rank, first pv move, and cp score', () => {
    expect(
      parseMultiPvInfo('info depth 6 seldepth 8 multipv 2 score cp 34 nodes 12345 pv d2d4 d7d5 c2c4')
    ).toEqual({ multipv: 2, move: 'd2d4', scoreCp: 34, scoreMate: null });
  });

  it('extracts a mate score instead of a cp score', () => {
    expect(parseMultiPvInfo('info depth 6 multipv 1 score mate 3 nodes 1 pv f7f8q')).toEqual({
      multipv: 1,
      move: 'f7f8q',
      scoreCp: null,
      scoreMate: 3,
    });
  });

  it('returns null for a line without multipv', () => {
    expect(parseMultiPvInfo('info depth 6 score cp 34 pv d2d4')).toBeNull();
  });

  it('returns null for a bestmove line', () => {
    expect(parseMultiPvInfo('bestmove e2e4 ponder e7e5')).toBeNull();
  });
});

describe('parseUciMove', () => {
  it('parses a simple move without promotion', () => {
    expect(parseUciMove('e2e4')).toEqual({ from: 'e2', to: 'e4' });
  });

  it('parses a promotion move', () => {
    expect(parseUciMove('e7e8q')).toEqual({ from: 'e7', to: 'e8', promotion: 'q' });
  });
});
