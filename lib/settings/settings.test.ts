import { describe, expect, it, beforeEach } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './settings';

const STORAGE_KEY = 'xadrez-settings';

describe('loadSettings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns the defaults when nothing is saved', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('returns previously saved settings', () => {
    saveSettings({ ...DEFAULT_SETTINGS, defaultDifficulty: 'dificil', defaultColor: 'black' });
    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: 'dificil',
      defaultColor: 'black',
    });
  });

  it('falls back to defaults field-by-field when one field is invalid', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, defaultDifficulty: 'impossivel', defaultColor: 'black' })
    );
    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: DEFAULT_SETTINGS.defaultDifficulty,
      defaultColor: 'black',
    });
  });

  it('falls back to defaults entirely when the saved data is not valid JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, 'not json{{{');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to defaults when the saved value is not an object', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify('a string, not an object'));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('returns previously saved theme choices', () => {
    saveSettings({ ...DEFAULT_SETTINGS, boardTheme: 'ebano-bordo', backgroundTheme: 'noturno' });
    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      boardTheme: 'ebano-bordo',
      backgroundTheme: 'noturno',
    });
  });

  it('falls back to default theme choices when saved values are invalid', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, boardTheme: 'nao-existe', backgroundTheme: 42 })
    );
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('returns a previously saved piece style', () => {
    saveSettings({ ...DEFAULT_SETTINGS, pieceStyle: 'moderno' });
    expect(loadSettings()).toEqual({ ...DEFAULT_SETTINGS, pieceStyle: 'moderno' });
  });

  it('falls back to the default piece style when the saved value is invalid', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, pieceStyle: 'nao-existe' })
    );
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe('saveSettings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists settings that loadSettings can read back', () => {
    saveSettings({ ...DEFAULT_SETTINGS, defaultDifficulty: 'medio', defaultColor: 'random' });
    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: 'medio',
      defaultColor: 'random',
    });
  });
});
