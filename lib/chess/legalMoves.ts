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

/**
 * Depois de chess.js aplicar um lance, o campo de "vez de jogar" do FEN
 * passa sempre para o adversário — o comportamento normal de uma partida
 * a duas. As demos interativas de `/aprender` não têm um segundo
 * jogador: é sempre a mesma peça em destaque (de uma só cor, `color`)
 * que se move sozinha, lance após lance. Sem corrigir isto,
 * `legalTargetsFrom` no próximo clique devolveria sempre `[]` (chess.js
 * só calcula lances para quem tem a vez), travando a demo ao fim do
 * primeiro lance.
 *
 * `color` é a cor da peça em destaque da demo (nunca muda ao longo da
 * demo, mesmo quando essa peça é preta — ex.: as demos de xeque/xeque-
 * -mate/afogamento de `/aprender/fim-de-jogo`) — força o campo de vez de
 * volta a essa cor e limpa o alvo de en passant (deixa de fazer sentido
 * depois de "voltar a vez" ao mesmo jogador).
 */
export function forceTurnFor(fen: string, color: 'w' | 'b'): string {
  const parts = fen.split(' ');
  parts[1] = color;
  parts[3] = '-';
  return parts.join(' ');
}

/**
 * Casa do rei em xeque, ou `null` se ninguém estiver em xeque nesta
 * posição — versão "pura" (sem instância `Chess` própria a manter) do
 * mesmo cálculo que `useChessGame`'s `findKingSquare` interno faz sobre
 * a sua instância já viva. Só o rei de quem tem a vez pode estar em
 * xeque numa posição válida, por isso não precisa de saber qual é a cor
 * da peça em destaque da demo — chamar depois de `forceTurnFor` já
 * garante que "quem tem a vez" é sempre essa peça.
 */
export function checkedKingSquare(fen: string): Square | null {
  const chess = new Chess(fen);
  if (!chess.inCheck()) return null;
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === chess.turn()) return cell.square as Square;
    }
  }
  return null;
}
