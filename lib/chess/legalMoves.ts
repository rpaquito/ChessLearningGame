import { Chess, type Square } from 'chess.js';

/**
 * Casas de destino legais para uma peça, a partir de um FEN — versão
 * "pura" (sem instância `Chess` própria a manter) da mesma lógica que
 * `useChessGame`'s `legalMovesFrom` aplica sobre a sua instância já viva.
 * Usada onde não há uma instância persistente para reaproveitar entre
 * chamadas (ex.: as demos de `/aprender/pecas`) — `useChessGame` mantém a
 * própria versão porque reconstruir um `Chess` a partir de FEN a cada
 * clique seria um passo a mais desnecessário ali, onde a instância já
 * existe.
 */
export function legalTargetsFrom(fen: string, square: Square): Square[] {
  return new Chess(fen).moves({ square, verbose: true }).map((m) => m.to as Square);
}
