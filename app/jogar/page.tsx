'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Chess, type Square } from 'chess.js';
import { useChessGame } from '@/lib/chess/useChessGame';
import { BACKGROUND_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { LearningPanel } from '@/components/LearningPanel/LearningPanel';
import { RulesModal } from '@/components/RulesModal/RulesModal';
import { difficultyToEngineOptions, type Difficulty } from '@/lib/chess/difficulty';
import { classifyMove, centipawnLoss, type MoveQuality } from '@/lib/chess/moveClassification';
import { useUser } from '@clerk/nextjs';
import { describeMove, explainMoveQuality } from '@/lib/chess/moveExplanation';
import { isPremiumUser } from '@/lib/auth/isPremiumUser';
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
    <Suspense fallback={<p className="p-8">A carregar…</p>}>
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
  const { settings } = useSettings();
  const { user } = useUser();
  const isPremium = isPremiumUser(user);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [learningEnabled, setLearningEnabled] = useState(true);
  const [suggestion, setSuggestion] = useState<{ from: Square; to: Square } | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionExplanation, setSuggestionExplanation] = useState<string | null>(null);
  const [lastMoveQuality, setLastMoveQuality] = useState<MoveQuality | null>(null);
  const [lastMoveExplanation, setLastMoveExplanation] = useState<string | null>(null);
  const [engineUnavailable, setEngineUnavailable] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const engineRef = useRef<StockfishClient | null>(null);
  useEffect(() => {
    if (mode !== 'ai') return;
    try {
      engineRef.current = createStockfishClient();
    } catch {
      // Worker construction almost never throws synchronously for a
      // same-origin script — real load failures arrive asynchronously via
      // the worker's 'error' event (handled inside stockfishClient.ts and
      // surfaced through the getBestMove()/evaluate() .catch() handlers
      // below). This guards only the rare synchronous-throw case.
      queueMicrotask(() => setEngineUnavailable(true));
      return;
    }
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
      setSuggestionExplanation(null);

      if (selectedSquare && legalMovesFrom(selectedSquare).includes(square)) {
        const fenBefore = state.fen;
        const preview = new Chess(fenBefore);
        const previewMove = preview.move({ from: selectedSquare, to: square, promotion: 'q' });
        const moved = makeMove(selectedSquare, square, 'q');
        setSelectedSquare(null);

        if (moved && previewMove && mode === 'ai' && learningEnabled && engineRef.current) {
          const engine = engineRef.current;
          const fenAfter = preview.fen();
          Promise.all([engine.evaluate(fenBefore, 10), engine.evaluate(fenAfter, 10)])
            .then(([bestEval, replyEval]) => {
              const playedEval = -replyEval;
              const loss = centipawnLoss(bestEval, playedEval);
              const quality = classifyMove(loss);
              setLastMoveQuality(quality);
              try {
                const tagSentence = describeMove(fenBefore, {
                  from: selectedSquare,
                  to: square,
                  promotion: 'q',
                });
                setLastMoveExplanation(explainMoveQuality(quality, tagSentence, loss));
              } catch {
                setLastMoveExplanation(null);
              }
            })
            .catch(() => {
              setEngineUnavailable(true);
            });
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
    engine
      .getBestMove(state.fen, difficultyToEngineOptions(difficulty))
      .then((uci) => {
        if (cancelled) return;
        const { from, to, promotion } = parseUciMove(uci);
        makeMove(from as Square, to as Square, promotion as Parameters<typeof makeMove>[2]);
      })
      .catch(() => {
        if (cancelled) return;
        setEngineUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, state.turn, state.isGameOver, state.fen, humanColor, difficulty, makeMove]);

  const handleRequestSuggestion = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setSuggestionLoading(true);
    const fenBefore = state.fen;
    engine
      .getBestMove(fenBefore, difficultyToEngineOptions('dificil'))
      .then((uci) => {
        const { from, to } = parseUciMove(uci);
        setSuggestion({ from: from as Square, to: to as Square });
        try {
          setSuggestionExplanation(
            describeMove(fenBefore, { from: from as Square, to: to as Square })
          );
        } catch {
          setSuggestionExplanation(null);
        }
        setSuggestionLoading(false);
      })
      .catch(() => {
        setSuggestionLoading(false);
        setEngineUnavailable(true);
      });
  }, [state.fen]);

  function handleReset() {
    reset();
    setSelectedSquare(null);
    setSuggestion(null);
    setSuggestionExplanation(null);
    setLastMoveQuality(null);
    setLastMoveExplanation(null);
  }

  return (
    <main className="relative min-h-dvh flex flex-col md:flex-row items-center md:items-start justify-start md:justify-center gap-4 sm:gap-8 p-4 sm:p-8">
      <div
        className="fixed inset-0 -z-10 bg-stone-900 bg-cover bg-center"
        style={{ backgroundImage: `url(${BACKGROUND_THEMES[settings.backgroundTheme].image})` }}
        aria-hidden="true"
      />
      <div className="flex flex-col items-center gap-4">
        <p className="font-medium text-stone-100">{STATUS_LABEL[state.status]}</p>
        <ChessBoard
          fen={state.fen}
          boardTheme={settings.boardTheme}
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
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="underline text-stone-300">
            Menu inicial
          </Link>
          <button type="button" onClick={handleReset} className="underline text-stone-300">
            Reiniciar partida
          </button>
          <button type="button" onClick={() => setRulesOpen(true)} className="underline text-stone-300">
            Regras
          </button>
        </div>
        {mode === 'ai' && engineUnavailable && (
          <p className="max-w-sm rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            O motor de xadrez não pôde ser carregado. Tenta novamente mais tarde, ou joga no
            modo Dois jogadores.
          </p>
        )}
      </div>

      {mode === 'ai' && !engineUnavailable && (
        <LearningPanel
          isPremium={isPremium}
          enabled={learningEnabled}
          onToggle={setLearningEnabled}
          onRequestSuggestion={handleRequestSuggestion}
          suggestionLoading={suggestionLoading}
          hasSuggestion={Boolean(suggestion)}
          suggestionExplanation={suggestionExplanation}
          lastMoveQuality={lastMoveQuality}
          lastMoveExplanation={lastMoveExplanation}
        />
      )}

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </main>
  );
}
