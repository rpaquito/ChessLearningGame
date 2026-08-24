'use client';

import { useEffect, useRef, useState } from 'react';
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import { BOARD_THEMES } from '@/lib/settings/themes';
import type { BoardTheme, PieceStyle } from '@/lib/settings/settings';
import { PieceIcon } from './PieceIcon';
import { inferMove } from '@/lib/chess/inferMove';

export interface ChessBoardProps {
  fen: string;
  boardTheme?: BoardTheme;
  pieceStyle?: PieceStyle;
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

// Duração das transições CSS das peças (classes duration-* mais abaixo) —
// o timeout de remoção da peça capturada tem de bater certo com a duração
// do fade, senão ou desaparece a meio da animação ou fica um instante a
// mais sem animação nenhuma a correr.
const CAPTURE_FADE_MS = 150;

interface DisplayPiece {
  id: string;
  type: PieceSymbol;
  color: Color;
  square: Square;
  removing?: boolean;
}

/**
 * Constrói a lista de peças de raiz a partir de um FEN, sem qualquer
 * identidade herdada de uma lista anterior — cada casa ocupada só pode ter
 * uma peça, por isso a própria casa serve de id único. Usada tanto no
 * primeiro render (não há lista anterior) como no fallback de "não há
 * lance a animar" dentro de `applyMove` (deliberadamente sem identidade
 * preservada, para saltar direto em vez de animar).
 */
function piecesFromFen(fen: string): DisplayPiece[] {
  const board = new Chess(fen).board();
  const pieces: DisplayPiece[] = [];
  for (const row of board) {
    for (const cell of row) {
      if (cell) pieces.push({ id: `init-${cell.square}`, type: cell.type, color: cell.color, square: cell.square });
    }
  }
  return pieces;
}

/**
 * Aplica a transição de `prevFen` para `nextFen` à lista de peças exibidas,
 * preservando a identidade (id/key) de cada peça para que a mudança de
 * posição anime em vez de saltar. Quando `inferMove` não encontra nenhum
 * lance legal que ligue as duas posições (reinício de partida, posição
 * carregada do zero), a lista é recomposta de raiz a partir de `nextFen` —
 * sem ids preservados, portanto sem animação, o que é o comportamento
 * certo para esses casos.
 */
function applyMove(pieces: DisplayPiece[], prevFen: string, nextFen: string): DisplayPiece[] {
  const inferred = inferMove(prevFen, nextFen);
  if (!inferred) return piecesFromFen(nextFen);

  const mover = pieces.find((p) => !p.removing && p.square === inferred.from);
  if (!mover) return piecesFromFen(nextFen);

  const next = pieces.map((p) => {
    if (p.id === mover.id) {
      return { ...p, square: inferred.to, type: inferred.promotion ?? p.type };
    }
    if (inferred.castleRookFrom && p.square === inferred.castleRookFrom && !p.removing) {
      return { ...p, square: inferred.castleRookTo! };
    }
    return p;
  });

  if (inferred.capturedSquare) {
    return next.map((p) =>
      p.id !== mover.id && p.square === inferred.capturedSquare && !p.removing
        ? { ...p, removing: true }
        : p
    );
  }

  return next;
}

export function ChessBoard({
  fen,
  boardTheme = 'carvalho',
  pieceStyle = 'classico',
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
  const texture = BOARD_THEMES[boardTheme];
  const files = orientation === 'white' ? FILES : [...FILES].reverse();
  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse();

  const prevFenRef = useRef<string | null>(null);
  const [pieces, setPieces] = useState<DisplayPiece[]>(() => piecesFromFen(fen));

  useEffect(() => {
    const prevFen = prevFenRef.current;
    prevFenRef.current = fen;
    if (prevFen === null || prevFen === fen) return;
    setPieces((current) => applyMove(current, prevFen, fen));
  }, [fen]);

  useEffect(() => {
    if (!pieces.some((p) => p.removing)) return;
    const timeout = setTimeout(() => {
      setPieces((current) => current.filter((p) => !p.removing));
    }, CAPTURE_FADE_MS);
    return () => clearTimeout(timeout);
  }, [pieces]);

  return (
    <div
      role="grid"
      aria-label="Tabuleiro de xadrez"
      className="relative grid grid-cols-8 grid-rows-8 aspect-square w-full max-w-[min(92vw,62dvh,560px)] select-none border-4 border-stone-800 rounded-md overflow-hidden"
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
              style={{
                backgroundImage: `url(${isLight ? texture.light : texture.dark})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              className={[
                'relative flex items-center justify-center overflow-hidden aspect-square min-h-0 min-w-0',
                isLight ? 'bg-amber-100' : 'bg-amber-700',
                isLastMove ? 'ring-4 ring-yellow-400 ring-inset' : '',
                isSelected ? 'outline outline-4 outline-sky-500 -outline-offset-4' : '',
                isThreatened ? 'outline outline-4 outline-red-500 -outline-offset-4' : '',
                isSuggested ? 'outline outline-4 outline-emerald-500 -outline-offset-4' : '',
              ].join(' ')}
            >
              {isCheck && <span className="absolute inset-0 bg-red-500/50" />}
              {isLegalTarget && !piece && (
                <span className="absolute w-3 h-3 rounded-full bg-emerald-500/70" />
              )}
              {isLegalTarget && piece && (
                <span className="absolute inset-0 rounded-full ring-4 ring-emerald-500/70" />
              )}
            </button>
          );
        })
      )}

      {/* Camada de peças: separada da grelha de casas para que cada peça
          mantenha identidade (key) própria entre posições e a mudança de
          `top`/`left` anime via transição CSS, em vez de a peça ser
          desmontada/remontada na nova casa. pointer-events-none para que os
          cliques continuem a chegar aos botões das casas por baixo. */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {pieces.map((piece) => {
          const fileIdx = files.indexOf(piece.square[0]);
          const rankIdx = ranks.indexOf(piece.square[1]);
          return (
            <div
              key={piece.id}
              data-square={piece.square}
              data-piece={`${piece.color}${piece.type}`}
              data-piece-style={pieceStyle}
              data-removing={piece.removing ? 'true' : undefined}
              style={{ left: `${fileIdx * 12.5}%`, top: `${rankIdx * 12.5}%` }}
              className={[
                'absolute h-[12.5%] w-[12.5%] flex items-center justify-center',
                'transition-all duration-200 ease-out motion-reduce:transition-none',
                piece.removing ? 'opacity-0 scale-50 !duration-150 !ease-in' : 'opacity-100 scale-100',
                piece.color === 'w'
                  ? 'text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]'
                  : 'text-black drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]',
              ].join(' ')}
            >
              <PieceIcon type={piece.type} style={pieceStyle} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
