'use client';

import { Chess, type Square } from 'chess.js';
import { pieceGlyph } from './pieceGlyphs';

export interface ChessBoardProps {
  fen: string;
  orientation?: 'white' | 'black';
  selectedSquare?: Square | null;
  legalTargets?: Square[];
  lastMove?: { from: Square; to: Square } | null;
  checkSquare?: Square | null;
  threatenedSquares?: Square[];
  suggestedMove?: { from: Square; to: Square } | null;
  interactive?: boolean;
  onSquareClick?: (square: Square) => void;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function ChessBoard({
  fen,
  orientation = 'white',
  selectedSquare = null,
  legalTargets = [],
  lastMove = null,
  checkSquare = null,
  threatenedSquares = [],
  suggestedMove = null,
  interactive = true,
  onSquareClick,
}: ChessBoardProps) {
  const board = new Chess(fen).board();
  const files = orientation === 'white' ? FILES : [...FILES].reverse();
  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse();

  return (
    <div
      role="grid"
      aria-label="Tabuleiro de xadrez"
      className="grid grid-cols-8 aspect-square w-full max-w-[min(92vw,62dvh,560px)] select-none border-4 border-stone-800 rounded-md overflow-hidden"
    >
      {ranks.map((rank, rankIdx) =>
        files.map((file, fileIdx) => {
          const square = `${file}${rank}` as Square;
          const boardRankIdx = RANKS.indexOf(rank);
          const boardFileIdx = FILES.indexOf(file);
          const piece = board[boardRankIdx][boardFileIdx];
          const isLight = (fileIdx + rankIdx) % 2 === 0;
          const isSelected = selectedSquare === square;
          const isLegalTarget = legalTargets.includes(square);
          const isLastMove = lastMove?.from === square || lastMove?.to === square;
          const isCheck = checkSquare === square;
          const isThreatened = threatenedSquares.includes(square);
          const isSuggested = suggestedMove?.from === square || suggestedMove?.to === square;

          return (
            <button
              type="button"
              key={square}
              data-square={square}
              disabled={!interactive}
              onClick={() => onSquareClick?.(square)}
              className={[
                'relative flex items-center justify-center text-3xl sm:text-4xl aspect-square',
                isLight ? 'bg-amber-100' : 'bg-amber-700',
                isCheck ? 'bg-red-400' : '',
                isLastMove ? 'ring-4 ring-yellow-400 ring-inset' : '',
                isSelected ? 'outline outline-4 outline-sky-500 -outline-offset-4' : '',
                isThreatened ? 'outline outline-4 outline-red-500 -outline-offset-4' : '',
                isSuggested ? 'outline outline-4 outline-emerald-500 -outline-offset-4' : '',
              ].join(' ')}
            >
              {piece && (
                <span
                  className={
                    piece.color === 'w'
                      ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]'
                      : 'text-black'
                  }
                >
                  {pieceGlyph(piece.type)}
                </span>
              )}
              {isLegalTarget && !piece && (
                <span className="absolute w-3 h-3 rounded-full bg-slate-900/40" />
              )}
              {isLegalTarget && piece && (
                <span className="absolute inset-0 rounded-full ring-4 ring-slate-900/40" />
              )}
            </button>
          );
        })
      )}
    </div>
  );
}
