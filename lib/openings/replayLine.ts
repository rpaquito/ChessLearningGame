import { Chess, type PieceSymbol, type Square } from 'chess.js';
import type { Locale } from '@/lib/i18n/types';
import type { OpeningLine } from './types';

export interface ReplayedMove {
  fen: string;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  san: string;
  explanation: Record<Locale, string>;
}

/**
 * Reproduz uma linha de abertura desde a posição inicial, lance a
 * lance, devolvendo o FEN resultante e os campos de que tanto o modo
 * de estudo (desenhar o tabuleiro + mostrar a explicação) como o modo
 * de prática (comparar o lance do utilizador com o {from,to,promotion}
 * esperado) vão precisar — sem nenhum dos dois ter de reimplementar a
 * reprodução da linha.
 *
 * Lança um erro descritivo se algum `san` for ilegal na posição em que
 * é jogado — nunca deve acontecer em produção (ver replayLine.test.ts,
 * que valida todas as linhas reais de `OPENINGS`), mas serve como rede
 * de segurança clara para conteúdo mal escrito.
 */
export function replayLine(line: OpeningLine): ReplayedMove[] {
  const chess = new Chess();

  return line.moves.map(({ san, explanation }) => {
    let move;
    try {
      move = chess.move(san);
    } catch {
      move = null;
    }

    if (!move) {
      throw new Error(
        `Lance ilegal "${san}" na linha "${line.name.pt}" a partir de ${chess.fen()}`
      );
    }

    return {
      fen: chess.fen(),
      from: move.from as Square,
      to: move.to as Square,
      promotion: move.promotion,
      san: move.san,
      explanation,
    };
  });
}
