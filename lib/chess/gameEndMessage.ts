import type { GameStatus } from './useChessGame';
import type { Locale } from '@/lib/i18n/types';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';

/** Que ilustração/tom mostrar no GameEndModal — ver mascotAssets.ts. */
export type GameEndKind = 'win' | 'lose' | 'draw';

export interface GameEndDescription {
  title: string;
  kind: GameEndKind;
}

/**
 * Frase + tom de fim de jogo para o GameEndModal — só cobre os estados
 * verdadeiramente terminais (xeque-mate/afogamento/empate). Devolve
 * null para 'playing'/'check', que não abrem o modal.
 *
 * O modo local nunca devolve 'lose' — é sempre 'win' (para quem venceu)
 * ou 'draw', nunca uma perspetiva de derrota (não há "tu" no ecrã
 * partilhado por dois jogadores).
 */
export function describeGameEnd(
  status: GameStatus,
  mode: 'ai' | 'local',
  humanColor: 'w' | 'b',
  turn: 'w' | 'b',
  locale: Locale
): GameEndDescription | null {
  const t = DICTIONARIES[locale].gameEnd;
  if (status === 'checkmate') {
    // `turn` é sempre o lado que está em xeque-mate (a jogar, sem
    // lances legais) — o vencedor é sempre o lado oposto.
    if (mode === 'ai') {
      return turn === humanColor
        ? { title: t.lostCheckmate, kind: 'lose' }
        : { title: t.wonCheckmate, kind: 'win' };
    }
    // Jogador 1 = brancas (posição "normal", não invertida do tabuleiro
    // local); Jogador 2 = pretas.
    return turn === 'w'
      ? { title: t.checkmateBlackWins, kind: 'win' }
      : { title: t.checkmateWhiteWins, kind: 'win' };
  }
  if (status === 'stalemate') return { title: t.stalemateDraw, kind: 'draw' };
  if (status === 'draw') return { title: t.draw, kind: 'draw' };
  return null;
}
