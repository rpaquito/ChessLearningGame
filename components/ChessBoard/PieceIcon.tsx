import type { PieceSymbol } from 'chess.js';

// Simple, hand-drawn monochrome piece silhouettes — deliberately NOT
// Unicode chess glyphs. Those depend on whatever font/emoji rendering the
// device picks for U+2654-265F, which varies wildly across mobile
// browsers/OSes: from "wrong style" (missing glyph coverage, historically
// worst for U+265F, the black pawn) to "rendered as an oversized
// color-emoji that breaks the board's layout" (reproduced on a real phone
// — see CLAUDE.md). An inline SVG renders identically everywhere. Color
// still comes purely from `fill="currentColor"`, same as the text glyphs
// it replaces — ChessBoard.tsx keeps controlling color via its
// text-white/text-black wrapper classes.
//
// All six shapes share one base plinth and, for the three "tall" pieces
// (bishop/queen/king), the same tapered body — real chess sets differentiate
// those three mainly by what sits on top, not by torso shape.
const BASE = <rect x="22" y="82" width="56" height="9" rx="3" />;
const TALL_BODY = (
  <path d="M50,38 C41,38 34,47 37,57 C31,62 29,72 35,83 L65,83 C71,72 69,62 63,57 C66,47 59,38 50,38 Z" />
);

function PieceShape({ type }: { type: PieceSymbol }) {
  switch (type) {
    case 'p':
      return (
        <>
          <circle cx="50" cy="26" r="12" />
          <path d="M40,42 C40,38 44,36 50,36 C56,36 60,38 60,42 L67,76 C68,79 66,82 62,82 L38,82 C34,82 32,79 33,76 Z" />
          {BASE}
        </>
      );
    case 'r':
      return (
        <>
          <rect x="26" y="14" width="11" height="16" />
          <rect x="44.5" y="14" width="11" height="16" />
          <rect x="63" y="14" width="11" height="16" />
          <rect x="24" y="28" width="52" height="10" />
          <rect x="28" y="38" width="44" height="45" />
          {BASE}
        </>
      );
    case 'n':
      return (
        <>
          <polygon points="20,30 4,35 5,40 20,42 28,38 32,48 38,60 42,83 68,83 72,58 70,32 58,18 48,4 52,5 44,17 34,14 24,20" />
          {BASE}
        </>
      );
    case 'b':
      return (
        <>
          <circle cx="50" cy="15" r="6" />
          <path d="M50,24 C41,24 35,34 38,45 C32,50 30,60 35,70 C31,74 31,79 34,83 L66,83 C69,79 69,74 65,70 C70,60 68,50 62,45 C65,34 59,24 50,24 Z" />
          <rect x="41" y="31" width="18" height="4" rx="2" transform="rotate(-25 50 33)" />
          {BASE}
        </>
      );
    case 'q':
      return (
        <>
          <path d="M28,38 L34,20 L41,32 L50,16 L59,32 L66,20 L72,38 Z" />
          <circle cx="34" cy="20" r="4" />
          <circle cx="50" cy="16" r="5" />
          <circle cx="66" cy="20" r="4" />
          {TALL_BODY}
          {BASE}
        </>
      );
    case 'k':
      return (
        <>
          <rect x="47" y="8" width="6" height="18" rx="1" />
          <rect x="40" y="13" width="20" height="6" rx="1" />
          <rect x="32" y="28" width="36" height="10" rx="2" />
          {TALL_BODY}
          {BASE}
        </>
      );
    default:
      return null;
  }
}

export function PieceIcon({ type }: { type: PieceSymbol }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className="h-[72%] w-[72%]" aria-hidden="true">
      <PieceShape type={type} />
    </svg>
  );
}
