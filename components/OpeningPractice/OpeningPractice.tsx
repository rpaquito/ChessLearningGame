'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { LineTabs } from '@/components/LineTabs/LineTabs';
import { useSettings } from '@/lib/settings/useSettings';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { replayLine } from '@/lib/openings/replayLine';
import { legalTargetsFrom, checkedKingSquare } from '@/lib/chess/legalMoves';
import type { Opening } from '@/lib/openings/types';

const START_FEN = new Chess().fen();
const OPPONENT_MOVE_DELAY_MS = 500;

/**
 * "defesa-*" são respostas às pretas; todo o resto ("abertura-*",
 * "gambito-da-dama", "sistema-londres") são sistemas das brancas.
 * Cobre os 12 ids reais de OPENINGS sem precisar de um campo novo no
 * modelo de dados — ver spec para a verificação caso a caso.
 */
function protagonistColorFor(opening: Opening): 'w' | 'b' {
  return opening.id.startsWith('defesa-') ? 'b' : 'w';
}

export function OpeningPractice({ opening }: { opening: Opening }) {
  const { settings } = useSettings();
  const { t, locale } = useTranslation();
  const protagonistColor = useMemo(() => protagonistColorFor(opening), [opening]);
  const tabLines = useMemo(() => opening.lines.map((line) => ({ name: line.name[locale] })), [opening, locale]);
  const replayedLines = useMemo(() => opening.lines.map((line) => replayLine(line)), [opening]);

  const [lineIndex, setLineIndex] = useState(0);
  const [plyIndex, setPlyIndex] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [wrongAttempt, setWrongAttempt] = useState(false);

  const replayed = replayedLines[lineIndex];
  const fen = plyIndex === 0 ? START_FEN : replayed[plyIndex - 1].fen;
  const lastMove = plyIndex === 0 ? null : { from: replayed[plyIndex - 1].from, to: replayed[plyIndex - 1].to };
  const checkSquare = checkedKingSquare(fen);
  const completed = plyIndex === replayed.length;
  const nextMoverColor: 'w' | 'b' = plyIndex % 2 === 0 ? 'w' : 'b';
  const isUserTurn = !completed && nextMoverColor === protagonistColor;
  const legalTargets = selectedSquare ? legalTargetsFrom(fen, selectedSquare) : [];
  const expected = completed ? null : replayed[plyIndex];

  function selectLine(index: number) {
    setLineIndex(index);
    setPlyIndex(0);
    setSelectedSquare(null);
    setWrongAttempt(false);
  }

  function restartLine() {
    setPlyIndex(0);
    setSelectedSquare(null);
    setWrongAttempt(false);
  }

  // O adversário joga sempre o lance da própria linha, automaticamente.
  // `lineIndex` entra nas deps mesmo não sendo lido no corpo do efeito:
  // sem ele, trocar de linha *enquanto* este temporizador já está a
  // contar (mesmo plyIndex/isUserTurn/completed de antes e depois, ex.:
  // 0→0 ao trocar logo no início) não reinicia o temporizador — o
  // lance do adversário da linha nova acaba por disparar mais cedo do
  // que os OPPONENT_MOVE_DELAY_MS prometidos.
  useEffect(() => {
    if (completed || isUserTurn) return;
    const timer = setTimeout(() => {
      setPlyIndex((p) => p + 1);
    }, OPPONENT_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [completed, isUserTurn, plyIndex, lineIndex]);

  function handleSquareClick(square: Square) {
    if (!isUserTurn || !expected) return;

    if (selectedSquare && legalTargets.includes(square)) {
      if (square === expected.to && selectedSquare === expected.from) {
        setPlyIndex((p) => p + 1);
        setWrongAttempt(false);
      } else {
        setWrongAttempt(true);
      }
      setSelectedSquare(null);
      return;
    }
    // Não limpa wrongAttempt aqui — só quando um lance é de facto jogado
    // (certo ou um novo erro), nunca por reselecionar uma casa. Mesmo
    // padrão de app/jogar/page.tsx: escolher a peça sugerida (o primeiro
    // passo natural para a jogar) não pode apagar a pista antes de
    // chegar à casa de destino.
    setSelectedSquare(square);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <LineTabs lines={tabLines} activeIndex={lineIndex} onSelect={selectLine}>
        <div className="w-[min(98vw,62dvh,560px)] sm:w-[min(92vw,62dvh,560px)] flex flex-col items-center gap-3">
          <ChessBoard
            fen={fen}
            boardTheme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            orientation={protagonistColor === 'w' ? 'white' : 'black'}
            selectedSquare={selectedSquare}
            legalTargets={legalTargets}
            lastMove={lastMove}
            checkSquare={checkSquare}
            suggestedMove={wrongAttempt && expected ? { from: expected.from, to: expected.to } : null}
            interactive={isUserTurn}
            onSquareClick={handleSquareClick}
          />

          {completed ? (
            <div
              className="w-full rounded-xl border-2 border-gold bg-ink-soft p-4 text-center flex flex-col gap-3"
              aria-live="polite"
            >
              <p className="font-semibold text-gold">{t.openings.lineComplete}</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <ChipButton color="pink" onClick={restartLine}>
                  {t.openings.practiceAgain}
                </ChipButton>
                <ChipButton color="purple" href="/aprender/aberturas">
                  {t.openings.backToOpenings}
                </ChipButton>
              </div>
            </div>
          ) : (
            <div className="w-full rounded-xl border-2 border-purple/40 bg-ink-soft p-4 text-center" aria-live="polite">
              {isUserTurn ? (
                wrongAttempt ? (
                  <p className="text-lilac/80">{t.openings.wrongMove(expected!.san)}</p>
                ) : (
                  <p className="text-lilac/80">{t.openings.yourTurn}</p>
                )
              ) : (
                <p className="text-lilac/80">{t.common.thinking}</p>
              )}
            </div>
          )}
        </div>
      </LineTabs>
    </div>
  );
}
