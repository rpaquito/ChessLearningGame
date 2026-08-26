import { describe, expect, it, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSettings, __resetSettingsCacheForTests } from './useSettings';
import { DEFAULT_SETTINGS, loadSettings } from './settings';

describe('useSettings', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // O cache por trás de useSettings é de módulo (ver useSettings.ts) —
    // sobrevive entre testes deste ficheiro sem este reset.
    __resetSettingsCacheForTests();
  });

  it('starts from the defaults when nothing is saved', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('starts from whatever was already saved', () => {
    window.localStorage.setItem(
      'xadrez-settings',
      JSON.stringify({ ...DEFAULT_SETTINGS, defaultDifficulty: 'dificil', defaultColor: 'black' })
    );
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: 'dificil',
      defaultColor: 'black',
    });
  });

  it('updateSettings merges a partial change and persists it', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ defaultColor: 'black' });
    });
    expect(result.current.settings).toEqual({ ...DEFAULT_SETTINGS, defaultColor: 'black' });
    // Persisted for real, not just in local React state — a fresh load
    // from storage sees the same value.
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, defaultColor: 'black' });
  });

  it('two separate updateSettings calls both persist (no lost update)', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ defaultDifficulty: 'medio' });
    });
    act(() => {
      result.current.updateSettings({ defaultColor: 'random' });
    });
    expect(result.current.settings).toEqual({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: 'medio',
      defaultColor: 'random',
    });
  });

  it('does not lose an update when two updateSettings calls happen before a re-render settles', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ defaultDifficulty: 'medio' });
      result.current.updateSettings({ defaultColor: 'random' });
    });
    expect(result.current.settings).toEqual({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: 'medio',
      defaultColor: 'random',
    });
  });
});
