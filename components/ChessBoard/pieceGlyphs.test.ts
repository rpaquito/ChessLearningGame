import { describe, expect, it } from 'vitest';
import type { PieceSymbol } from 'chess.js';
import { pieceGlyph } from './pieceGlyphs';

const TYPES: PieceSymbol[] = ['p', 'n', 'b', 'r', 'q', 'k'];

describe('pieceGlyph', () => {
  it('returns a distinct glyph for every piece type', () => {
    const glyphs = TYPES.map(pieceGlyph);
    expect(new Set(glyphs).size).toBe(TYPES.length);
  });

  it('never returns a code point from the black chess symbols block (U+265A-U+265F)', () => {
    // Regression test: white and black pieces used to come from two
    // different Unicode chess blocks. The "black" block (U+265A-265F) has
    // inconsistent font coverage across mobile browsers/OSes -- most
    // notably U+265F (black pawn) -- making black pieces look visually
    // unlike their white counterparts on some phones. Both colors now
    // share this one glyph set; color comes from CSS only.
    for (const type of TYPES) {
      const codePoint = pieceGlyph(type).codePointAt(0)!;
      expect(codePoint).not.toBeGreaterThanOrEqual(0x265a);
    }
  });
});
