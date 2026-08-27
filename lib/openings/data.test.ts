import { describe, expect, it } from 'vitest';
import { OPENINGS } from './data';

describe('OPENINGS', () => {
  it('has exactly 12 openings', () => {
    expect(OPENINGS).toHaveLength(12);
  });

  it('has unique kebab-case ids', () => {
    const ids = OPENINGS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it('gives every opening a non-empty name and description', () => {
    for (const opening of OPENINGS) {
      expect(opening.name.length).toBeGreaterThan(0);
      expect(opening.description.length).toBeGreaterThan(0);
    }
  });

  it('gives every defined eco code a valid ECO-classification shape (letter A-E + 2 digits)', () => {
    for (const opening of OPENINGS) {
      for (const line of opening.lines) {
        if (line.eco !== undefined) {
          expect(line.eco).toMatch(/^[A-E]\d{2}$/);
        }
      }
    }
  });

  it('gives every opening 1-3 lines, each with 8-12 moves and a name', () => {
    for (const opening of OPENINGS) {
      expect(opening.lines.length).toBeGreaterThan(0);
      expect(opening.lines.length).toBeLessThanOrEqual(3);
      for (const line of opening.lines) {
        expect(line.name.length).toBeGreaterThan(0);
        expect(line.moves.length).toBeGreaterThanOrEqual(8);
        expect(line.moves.length).toBeLessThanOrEqual(12);
        for (const move of line.moves) {
          expect(move.san.length).toBeGreaterThan(0);
          expect(move.explanation.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
