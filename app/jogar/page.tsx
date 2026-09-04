'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chess, type Square } from 'chess.js';
import { useChessGame } from '@/lib/chess/useChessGame';
import { BACKGROUND_THEMES } from '@/lib/settings/themes';
import { useSettings } from '@/lib/settings/useSettings';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ChessBoard } from '@/components/ChessBoard/ChessBoard';
import { LearningPanel } from '@/components/LearningPanel/LearningPanel';
import { RulesModal } from '@/components/RulesModal/RulesModal';
import { ChipButton } from '@/components/ChipButton/ChipButton';
import { PageGlow } from '@/components/PageChrome/PageChrome';
import { useToast } from '@/components/Toast/ToastProvider';
import { GameEndModal } from '@/components/GameEndModal/GameEndModal';
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal';
import { difficultyToEngineOptions, type Difficulty } from '@/lib/chess/difficulty';
import { classifyMove, centipawnLoss } from '@/lib/chess/moveClassification';
import { describeMove, explainMoveQuality } from '@/lib/chess/moveExplanation';
import { findThreatenedSquares } from '@/lib/chess/threats';
import { createStockfishClient, type StockfishClient } from '@/lib/chess/stockfishClient';
import { parseUciMove } from '@/lib/chess/uciParser';
import { hapticCapture, hapticCheck, hapticMove } from '@/lib/native/haptics';

export default function JogarPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <JogarContent />
    </Suspense>
  );
}

// Componente à parte porque precisa de useTranslation(), e o próprio
// Suspense boundary não pode chamar hooks que dependam de dados ainda a
// carregar dentro do fallback — mas useTranslation() não depende de
// nenhum dado assíncrono, só de useSettings() (síncrono), por isso isto
// funciona sem problema.
function LoadingFallback() {
  const { t } = useTranslation();
  return <p className="p-8">{t.jogar.loading}</p>;
}

function JogarContent() {
  const { t, locale } = useTranslation();
  const router = useRouter();
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
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [learningEnabled, setLearningEnabled] = useState(true);
  // Modo de aprendizagem só existe em 'facil'/'medio' — em 'dificil' o
  // painel nem sequer é montado (ver JSX abaixo), mas `learningEnabled`
  // continua a existir como estado (default true) para essas duas
  // dificuldades; `learningActive` é o valor real a usar em qualquer
  // lógica de jogo (ameaças, sugestão, feedback de qualidade), para nunca
  // depender só de `learningEnabled` sozinho e arriscar o modo continuar
  // "ligado" de facto quando a dificuldade não o permite.
  const learningAvailable = difficulty !== 'dificil';
  const learningActive = learningEnabled && learningAvailable;
  const [suggestion, setSuggestion] = useState<{ from: Square; to: Square } | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionExplanation, setSuggestionExplanation] = useState<string | null>(null);
  const [engineUnavailable, setEngineUnavailable] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { toast: currentToast, show: showToast, dismiss: dismissToast } = useToast();
  // Verdadeiro entre o momento em que um lance do jogador dispara a
  // avaliação assíncrona de qualidade (dois engine.evaluate()) e o
  // momento em que essa avaliação termina — impede a IA de jogar
  // enquanto o veredito do lance ainda está a ser calculado, mesmo antes
  // de o toast em si aparecer (ver handleSquareClick e o efeito do lance
  // da IA mais abaixo). Sem isto, a IA podia começar a pensar (e até
  // jogar) antes de o toast "boa jogada"/"imprecisão"/"erro" chegar a
  // aparecer.
  const [pendingMoveFeedback, setPendingMoveFeedback] = useState(false);
  // Um toast "bloqueante" (qualquer tom exceto 'info' — xeque e os três
  // tons de qualidade de lance, ver Toast.tsx/ToastProvider.tsx) exige
  // reconhecimento explícito antes de o jogo continuar: o tabuleiro deixa
  // de ser clicável e a IA não joga enquanto ele estiver visível.
  const blockingToastOpen = currentToast !== null && currentToast.tone !== 'info';
  const [gameEndOpen, setGameEndOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'restart' | 'menu' | null>(null);
  const prevStatus = useRef<typeof state.status>('playing');
  // Lido dentro do .then() da avaliação assíncrona do lance (abaixo) em
  // vez de currentToast diretamente — a promise pode resolver bem depois
  // de handleSquareClick ter sido definido, e um valor de closure ficaria
  // parado no toast que estava visível nesse momento. Sem isto, um lance
  // que também dá xeque arriscava o toast de qualidade substituir o de
  // xeque assim que a avaliação terminasse, desbloqueando o tabuleiro sem
  // o jogador ter reconhecido o xeque (ver o comentário sobre isto em
  // ToastProvider.tsx).
  const currentToastToneRef = useRef<string | null>(null);
  useEffect(() => {
    currentToastToneRef.current = currentToast?.tone ?? null;
  }, [currentToast]);
  // Só pede confirmação quando há de facto progresso a perder — uma
  // partida ainda na posição inicial não tem nada para "Reiniciar"/"Menu
  // inicial" deitarem fora.
  const hasProgress = state.lastMove !== null && !state.isGameOver;

  const STATUS_LABEL: Record<string, string> = {
    playing: t.jogar.status.playing,
    check: t.jogar.status.check,
    checkmate: t.jogar.status.checkmate,
    stalemate: t.jogar.status.stalemate,
    draw: t.jogar.status.draw,
  };

  // Dispara toast/modal só em MUDANÇAS de state.status, nunca a cada
  // render — ver docs/superpowers/specs/2026-08-27-popup-toast-feedback-design.md.
  useEffect(() => {
    if (state.status === prevStatus.current) return;
    prevStatus.current = state.status;

    if (state.status === 'check') {
      showToast(t.jogar.checkToast, 'check');
      hapticCheck();
    } else if (
      state.status === 'checkmate' ||
      state.status === 'stalemate' ||
      state.status === 'draw'
    ) {
      // Intentional: notifying the UI of a one-off transition (game just
      // ended), not deriving render state from props — same case as the
      // hand-off effect in lib/chess/useChessGame.ts.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGameEndOpen(true);
    }
  }, [state.status, showToast, t]);

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
  // selectedSquare volta sempre a null assim que um lance é jogado (ver
  // handleSquareClick), por isso nunca fica um valor a apontar para uma
  // posição já ultrapassada — dependência só em selectedSquare chega.
  const legalTargets = useMemo(
    () => (selectedSquare ? legalMovesFrom(selectedSquare) : []),
    [selectedSquare, legalMovesFrom]
  );
  // findThreatenedSquares varre as peças do adversário uma a uma — o cálculo
  // mais caro deste componente por render — por isso só recalcula quando a
  // posição/adversário/estado do modo de aprendizagem de facto mudam, não em
  // qualquer re-render (ex.: abrir/fechar as regras, clicar numa casa vazia).
  const threatenedSquares = useMemo(
    () => (learningActive && mode === 'ai' ? findThreatenedSquares(state.fen, humanColor) : []),
    [learningActive, mode, state.fen, humanColor]
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!isHumanTurn || state.isGameOver) return;

      if (selectedSquare && legalMovesFrom(selectedSquare).includes(square)) {
        // Só limpa a sugestão quando um lance é de facto jogado — nunca a
        // cada clique. Selecionar a peça sugerida (o primeiro passo natural
        // para a jogar) não pode apagar a sugestão antes de chegar à casa
        // de destino; ver o destaque correspondente em ChessBoard.tsx.
        setSuggestion(null);
        setSuggestionExplanation(null);
        const fenBefore = state.fen;
        const preview = new Chess(fenBefore);
        const previewMove = preview.move({ from: selectedSquare, to: square, promotion: 'q' });
        const moved = makeMove(selectedSquare, square, 'q');
        setSelectedSquare(null);

        if (moved && previewMove) {
          if (previewMove.isCapture()) {
            hapticCapture();
          } else {
            hapticMove();
          }
        }

        if (moved && previewMove && mode === 'ai' && learningActive && engineRef.current) {
          const engine = engineRef.current;
          const fenAfter = preview.fen();
          // Bloqueia o lance da IA já a partir daqui — antes mesmo de o
          // toast aparecer — ver comentário junto de pendingMoveFeedback
          // acima.
          setPendingMoveFeedback(true);
          Promise.all([engine.evaluate(fenBefore, 10), engine.evaluate(fenAfter, 10)])
            .then(([bestEval, replyEval]) => {
              const playedEval = -replyEval;
              const loss = centipawnLoss(bestEval, playedEval);
              const quality = classifyMove(loss);
              // Deixa o toast de xeque ganhar se as duas coisas coincidirem
              // (este lance também deu xeque) — ver o comentário junto de
              // currentToastToneRef acima.
              if (currentToastToneRef.current === 'check') {
                setPendingMoveFeedback(false);
                return;
              }
              let explanation: string | null;
              try {
                const tagSentence = describeMove(fenBefore, {
                  from: selectedSquare,
                  to: square,
                  promotion: 'q',
                }, locale);
                explanation = explainMoveQuality(quality, tagSentence, loss, locale);
              } catch {
                explanation = null;
              }
              const message = `${t.learningPanel.lastMoveLabel}${t.learningPanel.quality[quality]}${explanation ? ` — ${explanation}` : ''}`;
              showToast(message, quality);
              setPendingMoveFeedback(false);
            })
            .catch(() => {
              setEngineUnavailable(true);
              setPendingMoveFeedback(false);
            });
        }
        return;
      }
      setSelectedSquare(square);
    },
    [
      isHumanTurn,
      state.isGameOver,
      state.fen,
      selectedSquare,
      legalMovesFrom,
      makeMove,
      mode,
      learningActive,
      locale,
      t,
      showToast,
    ]
  );

  // IA joga automaticamente quando é a vez dela — mas só depois de
  // qualquer popup bloqueante (xeque, ou o feedback de qualidade do
  // lance do jogador, incluindo a avaliação ainda em curso) estar
  // resolvido; ver pendingMoveFeedback/blockingToastOpen acima. Ambos
  // entram nas dependências para o efeito voltar a correr assim que
  // deixarem de bloquear (ex.: o jogador fecha o toast).
  useEffect(() => {
    if (mode !== 'ai' || state.isGameOver || state.turn === humanColor) return;
    if (pendingMoveFeedback || blockingToastOpen) return;
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
  }, [
    mode,
    state.turn,
    state.isGameOver,
    state.fen,
    humanColor,
    difficulty,
    makeMove,
    pendingMoveFeedback,
    blockingToastOpen,
  ]);

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
            describeMove(fenBefore, { from: from as Square, to: to as Square }, locale)
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
  }, [state.fen, locale]);

  function handleReset() {
    reset();
    setSelectedSquare(null);
    setSuggestion(null);
    setSuggestionExplanation(null);
    setGameEndOpen(false);
    setPendingMoveFeedback(false);
    prevStatus.current = 'playing';
    dismissToast();
  }

  // "Reiniciar partida" e "Menu inicial" só pedem confirmação quando há
  // progresso a perder (hasProgress) — sem isso, agem de imediato.
  function handleRestartClick() {
    if (hasProgress) {
      setConfirmAction('restart');
    } else {
      handleReset();
    }
  }

  function handleMenuClick() {
    if (hasProgress) {
      setConfirmAction('menu');
    } else {
      router.push('/');
    }
  }

  function handleConfirmAction() {
    if (confirmAction === 'restart') {
      handleReset();
    } else if (confirmAction === 'menu') {
      router.push('/');
    }
    setConfirmAction(null);
  }

  function handleCancelConfirm() {
    setConfirmAction(null);
  }

  return (
    <main className="relative min-h-dvh flex flex-col md:flex-row md:flex-wrap items-center md:items-start justify-start md:justify-center gap-4 sm:gap-8 px-2 py-4 sm:p-8">
      <div
        className="fixed inset-0 -z-10 bg-ink bg-cover bg-center"
        style={{ backgroundImage: `url(${BACKGROUND_THEMES[settings.backgroundTheme].image})` }}
        aria-hidden="true"
      />
      {/* Mesma camada de identidade da página de menu — ver app/page.tsx. */}
      <PageGlow position="fixed" pinkOpacity={0.25} darken={[0.55, 0.85]} />
      {/* Mesma fórmula min(vw,dvh,560px) do próprio ChessBoard (w-full
          max-w-[...]), repetida aqui de propósito — ver "Tamanho do
          tabuleiro colapsava" em CLAUDE.md: sem um width definido aqui,
          este flex item fica sem largura definida (quer no eixo cruzado
          em coluna com items-center, quer no eixo principal em linha com
          flex-basis:auto), e o w-full do tabuleiro nunca chega a resolver
          contra a fórmula grande — colapsa para o tamanho intrínseco dos
          seus filhos. */}
      <div className="flex flex-col items-center gap-4 w-[min(98vw,62dvh,560px)] sm:w-[min(92vw,62dvh,560px)]">
        <p className="font-semibold text-gold">{STATUS_LABEL[state.status]}</p>
        <ChessBoard
          fen={state.fen}
          boardTheme={settings.boardTheme}
          pieceStyle={settings.pieceStyle}
          orientation={humanColor === 'w' ? 'white' : 'black'}
          selectedSquare={selectedSquare}
          legalTargets={legalTargets}
          lastMove={state.lastMove}
          checkSquare={state.checkSquare}
          threatenedSquares={threatenedSquares}
          suggestedMove={learningActive ? suggestion : null}
          interactive={isHumanTurn && !state.isGameOver && !blockingToastOpen}
          onSquareClick={handleSquareClick}
        />
        {mode === 'ai' && engineUnavailable && (
          <p className="max-w-sm rounded-2xl border-2 border-gold bg-ink-soft px-4 py-3 text-sm text-lilac">
            {t.jogar.engineUnavailable}
          </p>
        )}
      </div>

      {mode === 'ai' && !engineUnavailable && learningAvailable && (
        <LearningPanel
          enabled={learningEnabled}
          onToggle={setLearningEnabled}
          onRequestSuggestion={handleRequestSuggestion}
          suggestionLoading={suggestionLoading}
          hasSuggestion={Boolean(suggestion)}
          suggestionExplanation={suggestionExplanation}
        />
      )}

      {/* Fila de ações de nível de página — sempre o último elemento de
          <main>, para nunca ficar entalada entre o tabuleiro e o painel de
          aprendizagem. Em mobile (flex-col) a ordem do DOM já a põe por
          último; em desktop (md:flex-row), md:w-full força-a para a sua
          própria linha (com md:flex-wrap no main) em vez de virar uma
          terceira coluna ao lado do painel — ver CLAUDE.md. Continua
          irmã direta de <main>, sem wrapper extra à volta do tabuleiro e
          do LearningPanel: aninhar outro flex-col ali dentro faz o
          `w-full` do tabuleiro colapsar antes de o max-width entrar em
          jogo (shrink-to-fit com `items-center` duas vezes seguidas). */}
      <div className="flex items-center gap-3 flex-wrap justify-center md:w-full">
        <ChipButton color="purple" onClick={handleMenuClick}>
          {t.common.mainMenu}
        </ChipButton>
        <ChipButton color="pink" onClick={handleRestartClick}>
          {t.jogar.restart}
        </ChipButton>
        <ChipButton color="cyan" onClick={() => setRulesOpen(true)}>
          {t.jogar.rules}
        </ChipButton>
      </div>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <GameEndModal
        open={gameEndOpen}
        status={state.status}
        mode={mode}
        humanColor={humanColor}
        turn={state.turn}
        onClose={() => setGameEndOpen(false)}
        onPlayAgain={handleReset}
      />
      <ConfirmModal
        open={confirmAction !== null}
        title={confirmAction === 'restart' ? t.jogar.confirmRestartTitle : t.jogar.confirmMenuTitle}
        message={confirmAction === 'restart' ? t.jogar.confirmRestartMessage : t.jogar.confirmMenuMessage}
        confirmLabel={confirmAction === 'restart' ? t.jogar.confirmRestartButton : t.jogar.confirmMenuButton}
        cancelLabel={t.common.cancel}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirm}
      />
    </main>
  );
}
