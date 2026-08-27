'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chess, type Square } from 'chess.js';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { ACTIVE_TOGGLE_STYLE } from '@/lib/ui/activeToggleStyle';
import { useSettings } from '@/lib/settings/useSettings';
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
  const protagonistColor = useMemo(() => protagonistColorFor(opening), [opening]);
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
  useEffect(() => {
    if (completed || isUserTurn) return;
    const timer = setTimeout(() => {
      setPlyIndex((p) => p + 1);
      setWrongAttempt(false);
    }, OPPONENT_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [completed, isUserTurn, plyIndex]);

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
    setSelectedSquare(square);
    setWrongAttempt(false);
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
            <p className="font-semibold text-gold">Linha completa!</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <ChipButton color="pink" onClick={restartLine}>
                Praticar outra vez
              </ChipButton>
              <ChipButton color="purple" href="/aprender/aberturas">
                Voltar às aberturas
              </ChipButton>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-xl border-2 border-purple/40 bg-ink-soft p-4 text-center" aria-live="polite">
            {isUserTurn ? (
              wrongAttempt ? (
                <p className="text-lilac/80">
                  Não é esse — o lance da linha era {expected!.san}. Tenta de novo.
                </p>
              ) : (
                <p className="text-lilac/80">A tua vez: encontra o lance da linha.</p>
              )
            ) : (
              <p className="text-lilac/80">A pensar…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
