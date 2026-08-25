import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import { findThreatenedSquares } from './threats';
import type { MoveQuality } from './moveClassification';

export interface MoveInput {
  from: Square;
  to: Square;
  promotion?: string;
}

// Nome de cada peça em português de Portugal, sem artigo — usado tal e
// qual nas frases de promoção ("promove o peão a dama").
const PIECE_NAME: Record<PieceSymbol, string> = {
  p: 'peão',
  n: 'cavalo',
  b: 'bispo',
  r: 'torre',
  q: 'dama',
  k: 'rei',
};

// Torre e dama são femininas em português — precisam de "a", não "o".
const FEMININE_PIECES = new Set<PieceSymbol>(['r', 'q']);

function withArticle(piece: PieceSymbol): string {
  const article = FEMININE_PIECES.has(piece) ? 'a' : 'o';
  return `${article} ${PIECE_NAME[piece]}`;
}

const CENTER_SQUARES = new Set(['d4', 'd5', 'e4', 'e5']);
const BACK_RANK: Record<Color, string> = { w: '1', b: '8' };
const MINOR_PIECES = new Set<PieceSymbol>(['n', 'b']);

// Fullmove number até ao qual ainda consideramos que estamos "na abertura"
// para efeitos de assinalar desenvolvimento de peças.
const DEVELOPMENT_MOVE_LIMIT = 10;

function capitalize(sentence: string): string {
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * Descreve um lance em português de Portugal a partir de características
 * concretas detetadas na posição — nunca gera texto livre, só combina
 * frases feitas. Serve tanto para explicar uma jogada sugerida como para
 * explicar a qualidade do último lance jogado (ver moveClassification.ts).
 */
export function describeMove(fenBefore: string, move: MoveInput): string {
  const chess = new Chess(fenBefore);
  const color = chess.turn();
  const movingPiece = chess.get(move.from);
  const wasThreatened = findThreatenedSquares(fenBefore, color).includes(move.from);
  const fullmoveNumber = Number(fenBefore.split(' ')[5]);

  const verboseMove = chess.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion ?? 'q',
  });
  if (!verboseMove) {
    throw new Error(`Lance inválido: ${move.from}-${move.to}`);
  }

  if (verboseMove.san.endsWith('#')) {
    return 'Dá xeque-mate.';
  }

  const clauses: string[] = [];

  if (verboseMove.captured) {
    clauses.push(`captura ${withArticle(verboseMove.captured)} em ${move.to}`);
  }
  if (verboseMove.san.endsWith('+')) {
    clauses.push('dá xeque');
  }
  if (verboseMove.promotion) {
    clauses.push(`promove o peão a ${PIECE_NAME[verboseMove.promotion]} em ${move.to}`);
  }
  if (verboseMove.flags.includes('k')) {
    clauses.push('coloca o rei em segurança com o roque pequeno');
  }
  if (verboseMove.flags.includes('q')) {
    clauses.push('coloca o rei em segurança com o roque grande');
  }
  if (wasThreatened && movingPiece) {
    clauses.push(`afasta ${withArticle(movingPiece.type)} de uma ameaça`);
  }
  if (CENTER_SQUARES.has(move.to)) {
    clauses.push(`ocupa o centro em ${move.to}`);
  }
  if (
    movingPiece &&
    MINOR_PIECES.has(movingPiece.type) &&
    move.from.endsWith(BACK_RANK[color]) &&
    fullmoveNumber <= DEVELOPMENT_MOVE_LIMIT
  ) {
    clauses.push(`desenvolve ${withArticle(movingPiece.type)}`);
  }

  // Nunca genérico: mesmo sem nenhuma característica notável, nomeia a
  // peça e o destino em vez de um "é um lance posicional" vago.
  if (clauses.length === 0 && movingPiece) {
    clauses.push(`move ${withArticle(movingPiece.type)} para ${move.to}`);
  }

  return `${capitalize(clauses.slice(0, 2).join(' e '))}.`;
}

// Valor aproximado de cada peça em centipawns (convenção universal do
// xadrez: 1 peão = 100 centipawns) — usado só para dar ao número uma
// grandeza intuitiva, não para nenhum cálculo. Ver também a explicação
// de "centipawns" em RulesModal.tsx, que usa a mesma referência.
function centipawnFeel(loss: number): string {
  if (loss < 100) return 'menos do que um peão';
  if (loss < 300) return 'cerca de um peão';
  if (loss < 500) return 'cerca de uma peça menor, como um cavalo ou bispo';
  if (loss < 900) return 'cerca de uma torre';
  return 'mais do que uma dama';
}

/**
 * Combina a descrição de características do lance jogado (de
 * `describeMove`) com a classificação de qualidade já calculada em
 * moveClassification.ts, para explicar não só o que aconteceu no tabuleiro
 * mas também porque é que o lance foi bom, impreciso ou um erro. O número
 * de centipawns sozinho não diz nada a quem não é familiar com a unidade —
 * por isso vem sempre acompanhado de uma grandeza em termos de peças reais.
 */
export function explainMoveQuality(quality: MoveQuality, tagSentence: string, loss: number): string {
  if (quality === 'boa') {
    return tagSentence;
  }
  const suffix =
    quality === 'erro'
      ? `Foi um erro: perdeste cerca de ${loss} centipawns de vantagem (${centipawnFeel(loss)}).`
      : `Havia uma jogada melhor: perdeste cerca de ${loss} centipawns de vantagem (${centipawnFeel(loss)}).`;
  return `${tagSentence} ${suffix}`;
}
