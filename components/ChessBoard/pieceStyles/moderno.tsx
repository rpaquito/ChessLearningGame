import type { PieceSymbol } from 'chess.js';

// Second hand-drawn piece style — same convention as classico.tsx (no
// Unicode glyphs, `fill="currentColor"`, same 100x100 viewBox and overall
// proportions so the two styles swap cleanly). Deliberately angular:
// polygons instead of circles/curves, to read as a distinct family at a
// glance rather than a subtle variant. The knight keeps the exact classico
// silhouette — it's already the one polygon-based, asymmetric shape in
// that style, so there's nothing meaningfully "more angular" to give it.
const BASE = <polygon points="22,91 24,82 76,82 78,91" />;
const TALL_BODY = (
  <polygon points="50,38 40,45 38,55 41,59 34,64 37,83 63,83 66,64 59,59 62,55 60,45" />
);

export function PieceShape({ type }: { type: PieceSymbol }) {
  switch (type) {
    case 'p':
      return (
        <>
          <polygon points="62,26 56,36 44,36 38,26 44,16 56,16" />
          <polygon points="42,40 58,40 65,76 62,82 38,82 35,76" />
          {BASE}
        </>
      );
    case 'r':
      return (
        <>
          <polygon points="24,30 24,14 34,26 44,14 50,24 56,14 66,26 76,14 76,30" />
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
          <polygon points="50,9 57,16 50,23 43,16" />
          <polygon points="50,24 61,35 58,46 63,51 66,70 62,75 65,79 67,83 33,83 35,79 38,75 34,70 37,51 42,46 39,35" />
          <rect x="41" y="31" width="18" height="4" rx="2" transform="rotate(-25 50 33)" />
          {BASE}
        </>
      );
    case 'q':
      return (
        <>
          <polygon points="28,38 34,20 41,32 50,16 59,32 66,20 72,38" />
          <polygon points="34,15 38,20 34,25 30,20" />
          <polygon points="50,11 55,16 50,21 45,16" />
          <polygon points="66,15 70,20 66,25 62,20" />
          {TALL_BODY}
          {BASE}
        </>
      );
    case 'k':
      return (
        <>
          <rect x="47" y="8" width="6" height="18" />
          <rect x="40" y="13" width="20" height="6" />
          <polygon points="32,28 32,38 40,32 50,38 60,32 68,38 68,28" />
          {TALL_BODY}
          {BASE}
        </>
      );
    default:
      return null;
  }
}
