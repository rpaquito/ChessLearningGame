'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chess, type Square } from 'chess.js';
import { useChessGame } from '@/lib/chess/useChessGame';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { LearningPanel } from '@/components/LearningPanel/LearningPanel';
import { difficultyToEngineOptions, type Difficulty } from '@/lib/chess/difficulty';
import { classifyMove, centipawnLoss, type MoveQuality } from '@/lib/chess/moveClassification';
import { findThreatenedSquares } from '@/lib/chess/threats';
import { createStockfishClient, type StockfishClient } from '@/lib/chess/stockfishClient';
import { parseUciMove } from '@/lib/chess/uciParser';

const STATUS_LABEL: Record<string, string> = {
  playing: 'Em andamento',
  check: 'Xeque',
  checkmate: 'Xeque-mate',
  stalemate: 'Afogamento (empate)',
  draw: 'Empate',
};

export default function JogarPage() {
  return (
    <Suspense fallback={<p className="p-8">Carregando…</p>}>
      <JogarContent />
    </Suspense>
  );
}

function JogarContent() {
  const params = useSearchParams();
  const mode = params.get('mode') === 'local' ? 'local' : 'ai';
  const difficulty = (params.get('difficulty') as Difficulty) ?? 'facil';
  const requestedColor = params.get('color');
  const [humanColor] = useState<'w' | 'b'>(() => {
    if (requestedColor === 'black') return 'b';
    if (requestedColor === 'random') return Math.random() < 0.5 ? 'w' : 'b';
    return 'w';
  });

  const { state, legalMovesFrom, makeMove, reset } = useChessGame(true);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [learningEnabled, setLearningEnabled] = useState(true);
  const [suggestion, setSuggestion] = useState<{ from: Square; to: Square } | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [lastMoveQuality, setLastMoveQuality] = useState<MoveQuality | null>(null);

  const engineRef = useRef<StockfishClient | null>(null);
  useEffect(() => {
    if (mode !== 'ai') return;
    engineRef.current = createStockfishClient();
    return () => engineRef.current?.terminate();
  }, [mode]);

  const isHumanTurn = mode === 'local' || state.turn === humanColor;
  const legalTargets = selectedSquare ? legalMovesFrom(selectedSquare) : [];
  const threatenedSquares =
    learningEnabled && mode === 'ai' ? findThreatenedSquares(state.fen, humanColor) : [];

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!isHumanTurn || state.isGameOver) return;
      setSuggestion(null);

      if (selectedSquare && legalMovesFrom(selectedSquare).includes(square)) {
        const fenBefore = state.fen;
        const preview = new Chess(fenBefore);
        const previewMove = preview.move({ from: selectedSquare, to: square, promotion: 'q' });
        const moved = makeMove(selectedSquare, square, 'q');
        setSelectedSquare(null);

        if (moved && previewMove && mode === 'ai' && learningEnabled && engineRef.current) {
          const engine = engineRef.current;
          const fenAfter = preview.fen();
          Promise.all([engine.evaluate(fenBefore, 10), engine.evaluate(fenAfter, 10)]).then(
            ([bestEval, replyEval]) => {
              const playedEval = -replyEval;
              setLastMoveQuality(classifyMove(centipawnLoss(bestEval, playedEval)));
            }
          );
        }
        return;
      }
      setSelectedSquare(square);
    },
    [isHumanTurn, state.isGameOver, state.fen, selectedSquare, legalMovesFrom, makeMove, mode, learningEnabled]
  );

  // IA joga automaticamente quando é a vez dela
  useEffect(() => {
    if (mode !== 'ai' || state.isGameOver || state.turn === humanColor) return;
    const engine = engineRef.current;
    if (!engine) return;

    let cancelled = false;
    engine.getBestMove(state.fen, difficultyToEngineOptions(difficulty)).then((uci) => {
      if (cancelled) return;
      const { from, to, promotion } = parseUciMove(uci);
      makeMove(from as Square, to as Square, promotion as Parameters<typeof makeMove>[2]);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, state.turn, state.isGameOver, state.fen, humanColor, difficulty, makeMove]);

  const handleRequestSuggestion = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setSuggestionLoading(true);
    engine.getBestMove(state.fen, difficultyToEngineOptions('dificil')).then((uci) => {
      const { from, to } = parseUciMove(uci);
      setSuggestion({ from: from as Square, to: to as Square });
      setSuggestionLoading(false);
    });
  }, [state.fen]);

  function handleReset() {
    reset();
    setSelectedSquare(null);
    setSuggestion(null);
    setLastMoveQuality(null);
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row items-center md:items-start justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4">
        <p className="font-medium">{STATUS_LABEL[state.status]}</p>
        <ChessBoard
          fen={state.fen}
          orientation={humanColor === 'w' ? 'white' : 'black'}
          selectedSquare={selectedSquare}
          legalTargets={legalTargets}
          lastMove={state.lastMove}
          checkSquare={state.checkSquare}
          threatenedSquares={threatenedSquares}
          suggestedMove={learningEnabled ? suggestion : null}
          interactive={isHumanTurn && !state.isGameOver}
          onSquareClick={handleSquareClick}
        />
        <button type="button" onClick={handleReset} className="text-sm underline text-stone-600">
          Reiniciar partida
        </button>
      </div>

      {mode === 'ai' && (
        <LearningPanel
          enabled={learningEnabled}
          onToggle={setLearningEnabled}
          onRequestSuggestion={handleRequestSuggestion}
          suggestionLoading={suggestionLoading}
          hasSuggestion={Boolean(suggestion)}
          lastMoveQuality={lastMoveQuality}
        />
      )}
    </main>
  );
}
