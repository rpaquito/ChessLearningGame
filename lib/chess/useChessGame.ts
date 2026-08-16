import { useCallback, useState } from 'react';
import { Chess, type PieceSymbol, type Square } from 'chess.js';

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';

export interface ChessGameState {
  fen: string;
  turn: 'w' | 'b';
  status: GameStatus;
  history: string[];
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

const STORAGE_KEY = 'chess-learning-game-fen';

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
    history: chess.history(),
    isGameOver: chess.isGameOver(),
    checkSquare: status === 'check' || status === 'checkmate' ? findKingSquare(chess) : null,
    lastMove: last ? { from: last.from as Square, to: last.to as Square } : null,
  };
}

export function useChessGame(persist = true): UseChessGameResult {
  const [chess] = useState(() => {
    const instance = new Chess();
    if (persist && typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) instance.load(saved);
      } catch {
        // localStorage indisponível (ex.: modo privado) — começa do zero
      }
    }
    return instance;
  });
  const [state, setState] = useState<ChessGameState>(() => buildState(chess));

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
