import type { PieceSymbol } from 'chess.js';

// Terceiro estilo de peças — parte do redesenho "anime" (2026-08-25, ver
// CLAUDE.md e docs/superpowers/specs). Convenção "cristal/energia": silhuetas
// afiadas e denteadas (zigzag), em vez das curvas do classico ou dos
// polígonos simples do moderno — a mesma linguagem visual pontiaguda das
// coroas denteadas e faíscas usadas no resto da identidade nova. O cavalo
// mantém a mesma silhueta dos outros dois estilos (não há o que
// diferenciar sem forçar, mesmo convénio já usado em moderno.tsx) — só a
// base muda, para o SVG completo continuar distinto estilo a estilo.
const ANIME_BASE = (
  <polygon points="22,91 27,83 32,91 37,83 42,91 47,83 50,91 53,83 58,91 63,83 68,91 73,83 78,91" />
);
const ANIME_TALL_BODY = (
  <polygon points="50,38 42,45 40,55 43,59 36,64 39,83 61,83 64,64 57,59 60,55 58,45" />
);

export function PieceShape({ type }: { type: PieceSymbol }) {
  switch (type) {
    case 'p':
      return (
        <>
          <polygon points="50,14 60,26 50,38 40,26" />
          <polygon points="40,42 60,42 66,58 62,82 38,82 34,58" />
          {ANIME_BASE}
        </>
      );
    case 'r':
      return (
        <>
          <polygon points="24,30 24,14 33,26 42,14 50,26 58,14 67,26 76,14 76,30" />
          <rect x="28" y="38" width="44" height="45" />
          {ANIME_BASE}
        </>
      );
    case 'n':
      return (
        <>
          <polygon points="20,30 4,35 5,40 20,42 28,38 32,48 38,60 42,83 68,83 72,58 70,32 58,18 48,4 52,5 44,17 34,14 24,20" />
          {ANIME_BASE}
        </>
      );
    case 'b':
      return (
        <>
          <polygon points="50,8 57,15 50,22 43,15" />
          <polygon points="50,24 60,34 56,46 62,52 58,70 62,76 65,83 35,83 38,76 42,70 38,52 44,46 40,34" />
          <rect x="41" y="31" width="18" height="4" rx="2" transform="rotate(-25 50 33)" />
          {ANIME_BASE}
        </>
      );
    case 'q':
      return (
        <>
          <polygon points="27,38 34,18 42,30 50,14 58,30 66,18 73,38" />
          <polygon points="50,3 53,9 50,15 47,9" />
          {ANIME_TALL_BODY}
          {ANIME_BASE}
        </>
      );
    case 'k':
      return (
        <>
          <rect x="47" y="8" width="6" height="18" rx="1" />
          <rect x="40" y="13" width="20" height="6" rx="1" />
          <polygon points="32,30 32,38 40,30 48,38 50,30 52,38 60,30 68,38 68,30" />
          {ANIME_TALL_BODY}
          {ANIME_BASE}
        </>
      );
    default:
      return null;
  }
}
