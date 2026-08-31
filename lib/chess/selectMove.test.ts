import { describe, expect, it } from 'vitest';
import { selectWeightedMove } from './selectMove';

describe('selectWeightedMove', () => {
  it('always returns the single candidate when there is only one', () => {
    const move = selectWeightedMove([{ move: 'e2e4', score: 20 }], 1, () => 0.999);
    expect(move).toBe('e2e4');
  });

  it('always returns the best (first) candidate when randomness is 0', () => {
    const candidates = [
      { move: 'e2e4', score: 100 },
      { move: 'a2a3', score: -500 },
    ];
    // Even a random() that would favor the worse move at higher randomness
    // must not matter when randomness is 0.
    const move = selectWeightedMove(candidates, 0, () => 0.999);
    expect(move).toBe('e2e4');
  });

  it('almost always returns the best candidate when randomness is very low', () => {
    const candidates = [
      { move: 'e2e4', score: 100 },
      { move: 'a2a3', score: 0 },
    ];
    // At low randomness, the weaker move's weight is negligible, so even a
    // random() draw close to 1 should still land on the best move.
    const move = selectWeightedMove(candidates, 0.05, () => 0.99);
    expect(move).toBe('e2e4');
  });

  it('can return a weaker candidate when randomness is high and the draw favors it', () => {
    const candidates = [
      { move: 'e2e4', score: 100 },
      { move: 'a2a3', score: 0 },
    ];
    // At randomness 1, the two candidates' weights are close enough that a
    // high random() draw crosses into the weaker move's share.
    const move = selectWeightedMove(candidates, 1, () => 0.9);
    expect(move).toBe('a2a3');
  });
});
