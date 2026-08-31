import { describe, expect, it } from 'vitest';
import { difficultyToEngineOptions } from './difficulty';

describe('difficultyToEngineOptions', () => {
  it('maps facil to the engine\'s weakest real Elo and a shallow, mostly-random search', () => {
    expect(difficultyToEngineOptions('facil')).toEqual({
      limitStrength: true,
      elo: 1320,
      depth: 4,
      moveTimeMs: 250,
      multiPv: 4,
      randomness: 0.9,
    });
  });

  it('maps medio to a mid Elo target with some move variety', () => {
    expect(difficultyToEngineOptions('medio')).toEqual({
      limitStrength: true,
      elo: 1500,
      depth: 8,
      moveTimeMs: 700,
      multiPv: 2,
      randomness: 0.4,
    });
  });

  it('maps dificil to unlimited strength, always playing its best move', () => {
    expect(difficultyToEngineOptions('dificil')).toEqual({
      limitStrength: false,
      elo: 3190,
      depth: 18,
      moveTimeMs: 2200,
      multiPv: 1,
      randomness: 0,
    });
  });

  it('increases Elo target and depth as difficulty rises', () => {
    const facil = difficultyToEngineOptions('facil');
    const medio = difficultyToEngineOptions('medio');
    const dificil = difficultyToEngineOptions('dificil');
    expect(medio.elo).toBeGreaterThan(facil.elo);
    expect(dificil.elo).toBeGreaterThan(medio.elo);
    expect(medio.depth).toBeGreaterThan(facil.depth);
    expect(dificil.depth).toBeGreaterThan(medio.depth);
  });

  it('decreases randomness as difficulty rises, reaching zero at dificil', () => {
    const facil = difficultyToEngineOptions('facil');
    const medio = difficultyToEngineOptions('medio');
    const dificil = difficultyToEngineOptions('dificil');
    expect(medio.randomness).toBeLessThan(facil.randomness);
    expect(dificil.randomness).toBe(0);
  });
});
