import { useCallback, useEffect, useState } from 'react';
import { Chess, type PieceSymbol, type Square } from 'chess.js';

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';

export interface ChessGameState {
  fen: string;
  turn: 'w' | 'b';
  status: GameStatus;
  isGameOver: boolean;
  checkSquare: Square | null;
  lastMove: { from: Square; to: Square } | null;
}

export interface UseChessGameResult {
  state: ChessGameState;
  legalMovesFrom: (square: Square) => Square[];
  makeMove: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  reset: () => void;
}

export const STORAGE_KEY = 'chess-learning-game-fen';

/**
 * Limpa o FEN guardado, sem precisar de montar o hook. Usado antes de
 * começar uma partida nova (tanto no botão "Começar" de /configurar como
 * no clique direto em "Dois jogadores" no menu) — extraído para aqui em
 * vez de duplicar a mesma lógica defensiva de try/catch nos dois sítios.
 */
export function clearSavedGame(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage indisponível — nada para limpar, segue em frente
  }
}

function statusFromChess(chess: Chess): GameStatus {
  if (chess.isCheckmate()) return 'checkmate';
  if (chess.isStalemate()) return 'stalemate';
  if (chess.isDraw()) return 'draw';
  if (chess.isCheck()) return 'check';
  return 'playing';
}

function findKingSquare(chess: Chess): Square | null {
  const board = chess.board();
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.type === 'k' && cell.color === chess.turn()) {
        return cell.square as Square;
      }
    }
  }
  return null;
}

function buildState(chess: Chess): ChessGameState {
  const status = statusFromChess(chess);
  const verboseHistory = chess.history({ verbose: true });
  const last = verboseHistory[verboseHistory.length - 1];
  return {
    fen: chess.fen(),
    turn: chess.turn(),
    status,
    isGameOver: chess.isGameOver(),
    checkSquare: status === 'check' || status === 'checkmate' ? findKingSquare(chess) : null,
    lastMove: last ? { from: last.from as Square, to: last.to as Square } : null,
  };
}

export function useChessGame(persist = true): UseChessGameResult {
  const [chess] = useState(() => new Chess());
  const [state, setState] = useState<ChessGameState>(() => buildState(chess));

  // Tal como useSettings.ts, /jogar continua a ser renderizada no servidor
  // (não escapa a SSR só por estar atrás de useSearchParams/<Suspense>) —
  // ler o localStorage logo no inicializador do useState produzia HTML de
  // servidor (posição inicial) e de cliente (partida gravada) diferentes
  // sempre que já existisse uma partida guardada, um erro real de
  // hidratação. Por isso `chess` nasce sempre na posição inicial (igual
  // em servidor e cliente), e só este efeito — que só corre no cliente,
  // depois de montar — carrega o FEN guardado, se existir.
  useEffect(() => {
    if (!persist || typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        chess.load(saved);
        // Intentional: one-time hand-off from the SSR-safe starting
        // position to the real persisted game, right after mount — the
        // same "sync external store into React after hydration" case
        // useSettings.ts already has.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState(buildState(chess));
      }
    } catch {
      // localStorage indisponível (ex.: modo privado) — começa do zero
    }
  }, [chess, persist]);

  const persistFen = useCallback(
    (fen: string) => {
      if (!persist || typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(STORAGE_KEY, fen);
      } catch {
        // quota cheia ou indisponível — a partida continua sem persistir
      }
    },
    [persist]
  );

  const legalMovesFrom = useCallback(
    (square: Square): Square[] => {
      return chess.moves({ square, verbose: true }).map((m) => m.to as Square);
    },
    [chess]
  );

  const makeMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
      try {
        const move = chess.move({ from, to, promotion });
        if (!move) return false;
        const next = buildState(chess);
        setState(next);
        persistFen(next.fen);
        return true;
      } catch {
        return false;
      }
    },
    [chess, persistFen]
  );

  const reset = useCallback(() => {
    chess.reset();
    const next = buildState(chess);
    setState(next);
    persistFen(next.fen);
  }, [chess, persistFen]);

  return { state, legalMovesFrom, makeMove, reset };
}
