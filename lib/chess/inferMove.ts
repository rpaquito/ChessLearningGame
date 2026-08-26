import { Chess, type Square, type PieceSymbol } from 'chess.js';

export interface InferredMove {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  capturedSquare?: Square;
  castleRookFrom?: Square;
  castleRookTo?: Square;
}

/**
 * Descobre que lance liga duas posições consecutivas, para animação — não
 * para validar regras (isso continua a ser só o `useChessGame`/chess.js por
 * trás dele). Compara só o campo de colocação de peças do FEN (ignora
 * turno/direitos de roque/en-passant/relógios), por tolerância a chamadores
 * que montem o FEN de formas ligeiramente diferentes.
 *
 * Devolve `null` quando nenhum lance legal a partir de `prevFen` leva a
 * `nextFen` (reinício de partida, posição carregada do zero, etc.) — quem
 * chama isto trata `null` como "sem animação, salta direto".
 */
export function inferMove(prevFen: string, nextFen: string): InferredMove | null {
  let chess: Chess;
  try {
    chess = new Chess(prevFen);
  } catch {
    return null;
  }

  const nextPlacement = nextFen.split(' ')[0];
  const match = chess
    .moves({ verbose: true })
    .find((candidate) => candidate.after.split(' ')[0] === nextPlacement);
  if (!match) return null;

  const result: InferredMove = {
    from: match.from,
    to: match.to,
  };

  if (match.isPromotion() && match.promotion) {
    result.promotion = match.promotion;
  }

  if (match.isCapture() || match.isEnPassant()) {
    // Em passant captura um peão que não está na casa de destino, mas na
    // mesma coluna do destino e na mesma linha de onde o peão saiu.
    result.capturedSquare = match.isEnPassant()
      ? ((match.to[0] + match.from[1]) as Square)
      : match.to;
  }

  if (match.isKingsideCastle() || match.isQueensideCastle()) {
    const rank = match.from[1];
    result.castleRookFrom = (match.isKingsideCastle() ? `h${rank}` : `a${rank}`) as Square;
    result.castleRookTo = (match.isKingsideCastle() ? `f${rank}` : `d${rank}`) as Square;
  }

  return result;
}
