import { Chess, type Color, type Square } from 'chess.js';

/**
 * Retorna as casas ocupadas por peças de `color` que estão sob ataque
 * do adversário na posição dada, independentemente de quem tem a vez.
 *
 * Implementação: força o adversário a "jogar" trocando o campo de vez
 * no FEN, e reúne os destinos de captura sobre casas ocupadas por
 * `color`. Isso é uma aproximação pragmática (pode, em posições raras
 * de duplo xeque cruzado, deixar de contar uma peça que só ficaria
 * livre por causa da troca artificial de vez) — aceitável para um
 * recurso de dica, não para um motor de análise.
 */
export function findThreatenedSquares(fen: string, color: Color): Square[] {
  const parts = fen.split(' ');
  const opponent: Color = color === 'w' ? 'b' : 'w';
  parts[1] = opponent;
  const chess = new Chess(parts.join(' '));

  const board = chess.board();
  const ownSquares = new Set<Square>();
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.color === color) ownSquares.add(cell.square as Square);
    }
  }

  const threatened = new Set<Square>();
  for (const row of board) {
    for (const cell of row) {
      if (!cell || cell.color !== opponent) continue;
      const moves = chess.moves({ square: cell.square as Square, verbose: true });
      for (const move of moves) {
        if (ownSquares.has(move.to as Square)) threatened.add(move.to as Square);
      }
    }
  }
  return Array.from(threatened);
}
