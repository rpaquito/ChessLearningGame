import { describe, expect, it } from 'vitest';
import { classifyMove, centipawnLoss } from './moveClassification';

describe('centipawnLoss', () => {
  it('is zero when the played move matches the best move', () => {
    expect(centipawnLoss(50, 50)).toBe(0);
  });

  it('is the difference when the played move is worse', () => {
    expect(centipawnLoss(50, 10)).toBe(40);
  });

  it('never goes negative when the played move is better than expected', () => {
    expect(centipawnLoss(50, 80)).toBe(0);
  });
});

describe('classifyMove', () => {
  it('classifies 0 centipawn loss as a good move', () => {
    expect(classifyMove(0)).toBe('boa');
  });

  it('classifies exactly 30 centipawn loss as a good move', () => {
    expect(classifyMove(30)).toBe('boa');
  });

  it('classifies 31 centipawn loss as an imprecision', () => {
    expect(classifyMove(31)).toBe('imprecisao');
  });

  it('classifies exactly 100 centipawn loss as an imprecision', () => {
    expect(classifyMove(100)).toBe('imprecisao');
  });

  it('classifies 101 centipawn loss as a mistake', () => {
    expect(classifyMove(101)).toBe('erro');
  });

  it('throws for a negative centipawn loss', () => {
    expect(() => classifyMove(-1)).toThrow(RangeError);
  });
});
