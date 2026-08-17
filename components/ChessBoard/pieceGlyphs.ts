import type { PieceSymbol } from 'chess.js';

// Both colors render from the SAME code points — the "white" chess symbols
// block (U+2654-2659) — instead of white using that block and black using
// the separate "black chess pieces" block (U+265A-265F). That second block
// has inconsistent font coverage across mobile browsers/OSes, most notably
// ♟ U+265F (black pawn), which made black pieces look visually unlike their
// white counterparts on some phones (missing glyph / fallback font). Color
// is applied purely via CSS in ChessBoard.tsx, so one well-supported glyph
// set keeps every piece's shape identical everywhere — hence no `color`
// parameter here anymore.
const GLYPHS: Record<PieceSymbol, string> = {
  p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔',
};

export function pieceGlyph(type: PieceSymbol): string {
  return GLYPHS[type];
}
