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
    saveSettings({ defaultDifficulty: 'dificil', defaultColor: 'black' });
    expect(loadSettings()).toEqual({ defaultDifficulty: 'dificil', defaultColor: 'black' });
  });

  it('falls back to defaults field-by-field when one field is invalid', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ defaultDifficulty: 'impossivel', defaultColor: 'black' })
    );
    expect(loadSettings()).toEqual({
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
});

describe('saveSettings', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists settings that loadSettings can read back', () => {
    saveSettings({ defaultDifficulty: 'medio', defaultColor: 'random' });
    expect(loadSettings()).toEqual({ defaultDifficulty: 'medio', defaultColor: 'random' });
  });
});
