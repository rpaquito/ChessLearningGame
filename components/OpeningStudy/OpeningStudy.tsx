'use client';

import { useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { LineTabs } from '@/components/LineTabs/LineTabs';
import { useSettings } from '@/lib/settings/useSettings';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { replayLine, type ReplayedMove } from '@/lib/openings/replayLine';
import { checkedKingSquare } from '@/lib/chess/legalMoves';
import type { Opening } from '@/lib/openings/types';

const START_FEN = new Chess().fen();

/** "1. " para o 1º lance (brancas), "1..." para o 2º (pretas), etc. — as
 * linhas de abertura começam sempre pelas brancas, por isso a paridade do
 * índice (1-based) chega para decidir. */
function moveLabel(stepIndex: number): string {
  const fullmove = Math.ceil(stepIndex / 2);
  return stepIndex % 2 === 1 ? `${fullmove}. ` : `${fullmove}...`;
}

export function OpeningStudy({ opening }: { opening: Opening }) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const replayedLines = useMemo(() => opening.lines.map((line) => replayLine(line)), [opening]);
  const [lineIndex, setLineIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const replayed = replayedLines[lineIndex];
  const current: ReplayedMove | null = stepIndex === 0 ? null : replayed[stepIndex - 1];
  const fen = current?.fen ?? START_FEN;
  const lastMove = current ? { from: current.from, to: current.to } : null;
  const checkSquare = checkedKingSquare(fen);
  const prevButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  function selectLine(index: number) {
    setLineIndex(index);
    setStepIndex(0);
  }

  // Um <button disabled> nativo que tem o foco perde-o para <body> assim
  // que fica disabled (o browser faz isto sozinho, de forma assíncrona —
  // tentar apanhar isso depois, num useEffect, perde a corrida: o efeito
  // corre antes do browser ainda ter desativado/desfocado o botão). Em
  // vez disso, ao clicar num botão que vai atingir o limite da linha,
  // passa o foco para o irmão ainda ativo ANTES de o React o desativar —
  // assim o browser nunca chega a ter de "atirar" o foco para <body>.
  function goToStep(next: number) {
    if (next === 0) nextButtonRef.current?.focus();
    else if (next === replayed.length) prevButtonRef.current?.focus();
    setStepIndex(next);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <LineTabs lines={opening.lines} activeIndex={lineIndex} onSelect={selectLine}>
        <div className="w-[min(98vw,62dvh,560px)] sm:w-[min(92vw,62dvh,560px)] flex flex-col items-center gap-3">
          <ChessBoard
            fen={fen}
            boardTheme={settings.boardTheme}
            pieceStyle={settings.pieceStyle}
            lastMove={lastMove}
            checkSquare={checkSquare}
            interactive={false}
          />

          <div className="flex items-center gap-3">
            <ChipButton
              ref={prevButtonRef}
              color="pink"
              onClick={() => goToStep(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
            >
              {t.openings.previous}
            </ChipButton>
            <span className="text-sm text-lilac/80">
              {stepIndex} / {replayed.length}
            </span>
            <ChipButton
              ref={nextButtonRef}
              color="cyan"
              onClick={() => goToStep(Math.min(replayed.length, stepIndex + 1))}
              disabled={stepIndex === replayed.length}
            >
              {t.openings.next}
            </ChipButton>
          </div>

          <div
            className="w-full rounded-xl border-2 border-purple/40 bg-ink-soft p-4 text-center"
            aria-live="polite"
          >
            {current ? (
              <>
                <p className="font-semibold text-cyan">
                  {moveLabel(stepIndex)}{current.san}
                </p>
                <p className="text-lilac/80 mt-1">{current.explanation}</p>
              </>
            ) : (
              <p className="text-lilac/80">{t.openings.startPosition}</p>
            )}
          </div>
        </div>
      </LineTabs>
    </div>
  );
}
