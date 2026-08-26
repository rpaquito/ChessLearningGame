'use client';

import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';
import { useSettings } from '@/lib/settings/useSettings';
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
  const replayedLines = useMemo(() => opening.lines.map((line) => replayLine(line)), [opening]);
  const [lineIndex, setLineIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const replayed = replayedLines[lineIndex];
  const current: ReplayedMove | null = stepIndex === 0 ? null : replayed[stepIndex - 1];
  const fen = current?.fen ?? START_FEN;
  const lastMove = current ? { from: current.from, to: current.to } : null;
  const checkSquare = checkedKingSquare(fen);

  function selectLine(index: number) {
    setLineIndex(index);
    setStepIndex(0);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap gap-2 justify-center" role="tablist">
        {opening.lines.map((line, index) => (
          <button
            key={line.name}
            type="button"
            role="tab"
            aria-selected={index === lineIndex}
            onClick={() => selectLine(index)}
            style={index === lineIndex ? ACTIVE_TOGGLE_STYLE : undefined}
            className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-transform hover:scale-[1.02] ${
              index === lineIndex ? 'border-transparent shadow-[3px_3px_0_rgba(0,0,0,0.35)]' : 'border-purple/40 text-lilac'
            }`}
          >
            {line.name}
          </button>
        ))}
      </div>

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
          <ChipButton color="pink" onClick={() => setStepIndex((s) => Math.max(0, s - 1))} disabled={stepIndex === 0}>
            Anterior
          </ChipButton>
          <span className="text-sm text-lilac/80">
            {stepIndex} / {replayed.length}
          </span>
          <ChipButton
            color="cyan"
            onClick={() => setStepIndex((s) => Math.min(replayed.length, s + 1))}
            disabled={stepIndex === replayed.length}
          >
            Seguinte
          </ChipButton>
        </div>

        <div className="w-full rounded-xl border-2 border-purple/40 bg-ink-soft p-4 text-center">
          {current ? (
            <>
              <p className="font-semibold text-cyan">
                {moveLabel(stepIndex)}{current.san}
              </p>
              <p className="text-lilac/80 mt-1">{current.explanation}</p>
            </>
          ) : (
            <p className="text-lilac/80">Posição inicial — carrega em &quot;Seguinte&quot; para começar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
