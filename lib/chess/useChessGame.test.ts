import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useChessGame, clearSavedGame, STORAGE_KEY } from './useChessGame';

describe('useChessGame', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts at the standard opening position', () => {
    const { result } = renderHook(() => useChessGame(false));
    expect(result.current.state.turn).toBe('w');
    expect(result.current.state.status).toBe('playing');
    expect(result.current.state.history).toEqual([]);
    expect(result.current.state.checkSquare).toBeNull();
    expect(result.current.state.lastMove).toBeNull();
  });

  it('applies a legal move and updates the turn', () => {
    const { result } = renderHook(() => useChessGame(false));
    act(() => {
      const applied = result.current.makeMove('e2', 'e4');
      expect(applied).toBe(true);
    });
    expect(result.current.state.turn).toBe('b');
    expect(result.current.state.history).toEqual(['e4']);
    expect(result.current.state.lastMove).toEqual({ from: 'e2', to: 'e4' });
  });

  it('rejects an illegal move and keeps the state unchanged', () => {
    const { result } = renderHook(() => useChessGame(false));
    act(() => {
      const applied = result.current.makeMove('e2', 'e5');
      expect(applied).toBe(false);
    });
    expect(result.current.state.history).toEqual([]);
  });

  it('lists legal destination squares for a selected piece', () => {
    const { result } = renderHook(() => useChessGame(false));
    expect(result.current.legalMovesFrom('e2').sort()).toEqual(['e3', 'e4']);
  });

  it("detects checkmate (fool's mate) and reports the checked king square", () => {
    const { result } = renderHook(() => useChessGame(false));
    act(() => {
      result.current.makeMove('f2', 'f3');
      result.current.makeMove('e7', 'e5');
      result.current.makeMove('g2', 'g4');
      result.current.makeMove('d8', 'h4');
    });
    expect(result.current.state.status).toBe('checkmate');
    expect(result.current.state.isGameOver).toBe(true);
    expect(result.current.state.checkSquare).toBe('e1');
  });

  it('resets to the starting position', () => {
    const { result } = renderHook(() => useChessGame(false));
    act(() => {
      result.current.makeMove('e2', 'e4');
      result.current.reset();
    });
    expect(result.current.state.history).toEqual([]);
    expect(result.current.state.turn).toBe('w');
  });

  it('persists the position to localStorage and restores it on next mount', () => {
    const { result, unmount } = renderHook(() => useChessGame(true));
    act(() => {
      result.current.makeMove('e2', 'e4');
    });
    // Read after act() flushes: state updates queued inside an act()
    // callback aren't visible on `result.current` until the callback
    // returns, so this must be read outside the block, not inside it.
    const fenAfterMove = result.current.state.fen;
    unmount();

    const { result: restored } = renderHook(() => useChessGame(true));
    expect(restored.current.state.fen).toBe(fenAfterMove);
    expect(restored.current.state.turn).toBe('b');
  });

  it('clearSavedGame removes any persisted FEN', () => {
    const { result } = renderHook(() => useChessGame(true));
    act(() => {
      result.current.makeMove('e2', 'e4');
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    clearSavedGame();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
