'use client';

import { useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { legalTargetsFrom, forceTurnFor, checkedKingSquare } from '@/lib/chess/legalMoves';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface PieceDemo {
  title: string;
  description: string;
  fen: string;
  square: Square;
}

/**
 * Demo jogável de uma peça isolada, partilhada por todas as subpáginas de
 * `/aprender` que têm tabuleiro (pecas, regras-especiais, fim-de-jogo —
 * ver CLAUDE.md's secção "`/aprender/pecas`: demo jogável", origem deste
 * componente antes de ser extraído daqui para reutilização). Mantém o
 * próprio estado (fen + casa da peça em destaque) e usa chess.js só para
 * validar/aplicar o lance clicado — não é uma partida real, só a peça em
 * destaque desta demo se move, nunca peças "adversárias" — mas usa a
 * mesma interação de clicar-na-peça-depois-no-destino do modo de jogo, e
 * reaproveita a animação de deslize do ChessBoard de graça.
 *
 * A cor da peça em destaque é lida diretamente da posição inicial (nunca
 * passada à parte) — normalmente branca, mas as demos de xeque/xeque-
 * -mate/afogamento de fim-de-jogo têm o rei preto como protagonista, daí
 * `forceTurnFor` (não `forceWhiteToMove`) aceitar qualquer cor.
 */
export function InteractiveDemo({ title, description, fen: initialFen, square: initialSquare }: PieceDemo) {
  const { t } = useTranslation();
  const protagonistColor = new Chess(initialFen).get(initialSquare)?.color ?? 'w';
  const [fen, setFen] = useState(initialFen);
  const [square, setSquare] = useState<Square>(initialSquare);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const legalTargets = legalTargetsFrom(fen, square);
  const checkSquare = checkedKingSquare(fen);

  function handleSquareClick(target: Square) {
    if (!legalTargets.includes(target)) return;
    const chess = new Chess(fen);
    chess.move({ from: square, to: target, promotion: 'q' });
    setFen(forceTurnFor(chess.fen(), protagonistColor));
    setLastMove({ from: square, to: target });
    setSquare(target);
  }

  function handleReset() {
    setFen(initialFen);
    setSquare(initialSquare);
    setLastMove(null);
  }

  return (
    <section className="flex flex-col sm:flex-row gap-4 items-center">
      <div className="w-full sm:w-64 shrink-0 flex flex-col items-center gap-3">
        <ChessBoard
          fen={fen}
          selectedSquare={square}
          legalTargets={legalTargets}
          lastMove={lastMove}
          checkSquare={checkSquare}
          interactive
          onSquareClick={handleSquareClick}
        />
        <ChipButton color="pink" onClick={handleReset}>
          {t.interactiveDemo.reset}
        </ChipButton>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-cyan">{title}</h2>
        <p className="text-lilac/80 mt-1">{description}</p>
      </div>
    </section>
  );
}
