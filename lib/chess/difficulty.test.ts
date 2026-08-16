import { describe, expect, it } from 'vitest';
import { difficultyToEngineOptions } from './difficulty';

describe('difficultyToEngineOptions', () => {
  it('maps facil to a low skill level and shallow depth', () => {
    expect(difficultyToEngineOptions('facil')).toEqual({ skillLevel: 2, depth: 4, moveTimeMs: 300 });
  });

  it('maps medio to a mid skill level', () => {
    expect(difficultyToEngineOptions('medio')).toEqual({ skillLevel: 10, depth: 8, moveTimeMs: 800 });
  });

  it('maps dificil to the maximum skill level', () => {
    expect(difficultyToEngineOptions('dificil')).toEqual({ skillLevel: 20, depth: 14, moveTimeMs: 1500 });
  });

  it('increases skill level and depth as difficulty rises', () => {
    const facil = difficultyToEngineOptions('facil');
    const medio = difficultyToEngineOptions('medio');
    const dificil = difficultyToEngineOptions('dificil');
    expect(medio.skillLevel).toBeGreaterThan(facil.skillLevel);
    expect(dificil.skillLevel).toBeGreaterThan(medio.skillLevel);
    expect(medio.depth).toBeGreaterThan(facil.depth);
    expect(dificil.depth).toBeGreaterThan(medio.depth);
  });
});
