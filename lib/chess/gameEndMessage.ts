import type { GameStatus } from './useChessGame';
import type { Locale } from '@/lib/i18n/types';
import { DICTIONARIES } from '@/lib/i18n/dictionaries';

/**
 * Frase de fim de jogo para o GameEndModal — só cobre os estados
 * verdadeiramente terminais (xeque-mate/afogamento/empate). Devolve
 * null para 'playing'/'check', que não abrem o modal.
 */
export function describeGameEnd(
  status: GameStatus,
  mode: 'ai' | 'local',
  humanColor: 'w' | 'b',
  turn: 'w' | 'b',
  locale: Locale
): string | null {
  const t = DICTIONARIES[locale].gameEnd;
  if (status === 'checkmate') {
    // `turn` é sempre o lado que está em xeque-mate (a jogar, sem
    // lances legais) — o vencedor é sempre o lado oposto.
    if (mode === 'ai') {
      return turn === humanColor ? t.lostCheckmate : t.wonCheckmate;
    }
    return turn === 'w' ? t.checkmateBlackWins : t.checkmateWhiteWins;
  }
  if (status === 'stalemate') return t.stalemateDraw;
  if (status === 'draw') return t.draw;
  return null;
}
