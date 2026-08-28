import { describe, expect, it } from 'vitest';
import { OPENINGS } from './data';
import { VALID_LOCALES } from '@/lib/i18n/types';

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

  it('gives every opening a non-empty name and description in both locales', () => {
    for (const opening of OPENINGS) {
      for (const locale of VALID_LOCALES) {
        expect(opening.name[locale].length).toBeGreaterThan(0);
        expect(opening.description[locale].length).toBeGreaterThan(0);
      }
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

  it('gives every opening 1-3 lines, each with 8-12 moves and a name in both locales', () => {
    for (const opening of OPENINGS) {
      expect(opening.lines.length).toBeGreaterThan(0);
      expect(opening.lines.length).toBeLessThanOrEqual(3);
      for (const line of opening.lines) {
        for (const locale of VALID_LOCALES) {
          expect(line.name[locale].length).toBeGreaterThan(0);
        }
        expect(line.moves.length).toBeGreaterThanOrEqual(8);
        expect(line.moves.length).toBeLessThanOrEqual(12);
        for (const move of line.moves) {
          expect(move.san.length).toBeGreaterThan(0);
          for (const locale of VALID_LOCALES) {
            expect(move.explanation[locale].length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('has a genuinely translated (not duplicated) English explanation for every move', () => {
    // As explicações são sempre frases completas — nunca faz sentido que
    // a versão inglesa seja idêntica, byte a byte, à portuguesa (ao
    // contrário de alguns nomes de linha, como "Najdorf", que são termos
    // emprestados e legitimamente iguais nos dois idiomas — por isso este
    // teste cobre só `explanation`, nunca `name`/`description`).
    for (const opening of OPENINGS) {
      for (const line of opening.lines) {
        for (const move of line.moves) {
          expect(move.explanation.en).not.toBe(move.explanation.pt);
        }
      }
    }
  });

  it('has a genuinely different English name/description for every opening and line, except documented loanwords', () => {
    // "Najdorf" is a chess player's surname, used as a line name — a loanword
    // that is correctly identical in Portuguese and English. Any other
    // pt === en match here is a real bug (an untranslated copy-paste).
    const IDENTICAL_BY_DESIGN = new Set(['Najdorf']);

    for (const opening of OPENINGS) {
      if (!IDENTICAL_BY_DESIGN.has(opening.name.pt)) {
        expect(opening.name.en).not.toBe(opening.name.pt);
      }
      expect(opening.description.en).not.toBe(opening.description.pt);
      for (const line of opening.lines) {
        if (!IDENTICAL_BY_DESIGN.has(line.name.pt)) {
          expect(line.name.en).not.toBe(line.name.pt);
        }
      }
    }
  });
});
