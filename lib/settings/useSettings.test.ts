import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSettings } from './useSettings';
import { DEFAULT_SETTINGS, loadSettings } from './settings';

describe('useSettings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts from the defaults when nothing is saved', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('starts from whatever was already saved', () => {
    window.localStorage.setItem(
      'xadrez-settings',
      JSON.stringify({ defaultDifficulty: 'dificil', defaultColor: 'black' })
    );
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({ defaultDifficulty: 'dificil', defaultColor: 'black' });
  });

  it('updateSettings merges a partial change and persists it', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ defaultColor: 'black' });
    });
    expect(result.current.settings).toEqual({
      defaultDifficulty: DEFAULT_SETTINGS.defaultDifficulty,
      defaultColor: 'black',
    });
    // Persisted for real, not just in local React state — a fresh load
    // from storage sees the same value.
    expect(loadSettings()).toEqual({
      defaultDifficulty: DEFAULT_SETTINGS.defaultDifficulty,
      defaultColor: 'black',
    });
  });

  it('two separate updateSettings calls both persist (no lost update)', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ defaultDifficulty: 'medio' });
    });
    act(() => {
      result.current.updateSettings({ defaultColor: 'random' });
    });
    expect(result.current.settings).toEqual({ defaultDifficulty: 'medio', defaultColor: 'random' });
  });
});
