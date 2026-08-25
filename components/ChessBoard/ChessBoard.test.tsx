import { describe, expect, it, vi, afterEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { Chess, type Square } from 'chess.js';
import { ChessBoard } from './ChessBoard';

const START_FEN = new Chess().fen();

function fenAfter(moves: string[]): string {
  const chess = new Chess();
  for (const move of moves) chess.move(move);
  return chess.fen();
}

function pieceEls(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-piece]'));
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ChessBoard', () => {
  it('uses the nebulosa texture by default', () => {
    const { container } = render(<ChessBoard fen={START_FEN} />);
    const square = container.querySelector('button[data-square="a8"]') as HTMLButtonElement;
    expect(square.style.backgroundImage).toContain('/board/nebulosa-light-square.webp');
  });

  it('uses the given boardTheme texture', () => {
    const { container } = render(<ChessBoard fen={START_FEN} boardTheme="neon" />);
    const dark = container.querySelector('button[data-square="a1"]') as HTMLButtonElement;
    expect(dark.style.backgroundImage).toContain('/board/neon-dark-square.webp');
  });

  it('defaults to the classico piece style', () => {
    const { container } = render(<ChessBoard fen={START_FEN} />);
    const piece = pieceEls(container)[0];
    expect(piece.dataset.pieceStyle).toBe('classico');
  });

  it('uses the given pieceStyle for every piece', () => {
    const { container } = render(<ChessBoard fen={START_FEN} pieceStyle="moderno" />);
    for (const piece of pieceEls(container)) {
      expect(piece.dataset.pieceStyle).toBe('moderno');
    }
  });

  it('renders a piece for every occupied square of the given FEN', () => {
    const { container } = render(<ChessBoard fen={START_FEN} />);
    const pieces = pieceEls(container);
    expect(pieces).toHaveLength(32);
    const whiteKing = pieces.find((el) => el.dataset.square === 'e1');
    expect(whiteKing?.dataset.piece).toBe('wk');
    const blackKing = pieces.find((el) => el.dataset.square === 'e8');
    expect(blackKing?.dataset.piece).toBe('bk');
  });

  it('calls onSquareClick with the clicked square when interactive', () => {
    const onSquareClick = vi.fn();
    const { container } = render(
      <ChessBoard fen={START_FEN} interactive onSquareClick={onSquareClick} />
    );
    const square = container.querySelector('[data-square="e2"]') as HTMLButtonElement;
    square.click();
    expect(onSquareClick).toHaveBeenCalledWith('e2');
  });

  it('disables square buttons when not interactive', () => {
    const { container } = render(<ChessBoard fen={START_FEN} interactive={false} />);
    const square = container.querySelector('button[data-square="e2"]') as HTMLButtonElement;
    expect(square).toBeDisabled();
  });

  it('moves a piece to its destination square after the fen changes', () => {
    const { container, rerender } = render(<ChessBoard fen={START_FEN} />);
    rerender(<ChessBoard fen={fenAfter(['e4'])} />);

    const pieces = pieceEls(container);
    expect(pieces).toHaveLength(32);
    expect(pieces.some((el) => el.dataset.square === ('e2' as Square))).toBe(false);
    const moved = pieces.find((el) => el.dataset.square === 'e4');
    expect(moved?.dataset.piece).toBe('wp');
  });

  it('marks a captured piece as removing, then drops it after the fade-out delay', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<ChessBoard fen={fenAfter(['e4', 'd5'])} />);
    rerender(<ChessBoard fen={fenAfter(['e4', 'd5', 'exd5'])} />);

    let pieces = pieceEls(container);
    expect(pieces).toHaveLength(32); // capturer + captured still both present
    const captured = pieces.find((el) => el.dataset.square === 'd5' && el.dataset.piece === 'bp');
    expect(captured?.dataset.removing).toBe('true');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    pieces = pieceEls(container);
    expect(pieces).toHaveLength(31);
    const atD5 = pieces.filter((el) => el.dataset.square === 'd5');
    expect(atD5).toHaveLength(1);
    expect(atD5[0]?.dataset.piece).toBe('wp');
  });

  it('highlights both the origin and destination of a suggested move', () => {
    const { container } = render(
      <ChessBoard fen={START_FEN} suggestedMove={{ from: 'e2', to: 'e4' }} />
    );
    expect(container.querySelector('[data-square="e2"]')).toHaveAttribute('data-suggested', 'true');
    expect(container.querySelector('[data-square="e4"]')).toHaveAttribute('data-suggested', 'true');
    expect(container.querySelector('[data-square="d2"]')).not.toHaveAttribute('data-suggested');
  });

  it('keeps the suggestion highlight visible on a square that is also selected', () => {
    const { container } = render(
      <ChessBoard
        fen={START_FEN}
        selectedSquare="e2"
        suggestedMove={{ from: 'e2', to: 'e4' }}
      />
    );
    // Regression: selecting the suggested piece (the natural first step to
    // play it) used to clobber the emerald outline with the selection's sky
    // outline, since both were the same `outline` CSS property on the same
    // element — only one color could ever render. The suggestion highlight
    // must stay visible regardless of what else is going on with the square.
    expect(container.querySelector('[data-square="e2"]')).toHaveAttribute('data-suggested', 'true');
  });

  it('snaps to the new position without crashing when fen changes to an unrelated position', () => {
    const { container, rerender } = render(<ChessBoard fen={fenAfter(['e4', 'd5'])} />);
    const unrelatedFen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    rerender(<ChessBoard fen={unrelatedFen} />);

    const pieces = pieceEls(container);
    expect(pieces).toHaveLength(2);
    expect(pieces.map((el) => el.dataset.piece).sort()).toEqual(['bk', 'wk']);
  });
});
