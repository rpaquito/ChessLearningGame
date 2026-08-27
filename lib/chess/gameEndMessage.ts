import type { GameStatus } from './useChessGame';

/**
 * Frase de fim de jogo para o GameEndModal — só cobre os estados
 * verdadeiramente terminais (xeque-mate/afogamento/empate). Devolve
 * null para 'playing'/'check', que não abrem o modal.
 */
export function describeGameEnd(
  status: GameStatus,
  mode: 'ai' | 'local',
  humanColor: 'w' | 'b',
  turn: 'w' | 'b'
): string | null {
  if (status === 'checkmate') {
    // `turn` é sempre o lado que está em xeque-mate (a jogar, sem
    // lances legais) — o vencedor é sempre o lado oposto.
    if (mode === 'ai') {
      return turn === humanColor ? 'Perdeste. Xeque-mate.' : 'Ganhaste! Xeque-mate.';
    }
    return turn === 'w' ? 'Xeque-mate! Vencem as pretas.' : 'Xeque-mate! Vencem as brancas.';
  }
  if (status === 'stalemate') return 'Empate por afogamento.';
  if (status === 'draw') return 'Empate.';
  return null;
}
