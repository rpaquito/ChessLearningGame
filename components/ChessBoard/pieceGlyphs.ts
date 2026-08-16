import type { Color, PieceSymbol } from 'chess.js';

const WHITE_GLYPHS: Record<PieceSymbol, string> = {
  p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔',
};

const BLACK_GLYPHS: Record<PieceSymbol, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
};

export function pieceGlyph(type: PieceSymbol, color: Color): string {
  return color === 'w' ? WHITE_GLYPHS[type] : BLACK_GLYPHS[type];
}
