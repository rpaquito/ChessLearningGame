import { describe, expect, it, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './settings';

const STORAGE_KEY = 'xadrez-settings';

describe('loadSettings', () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Estes testes não são sobre deteção de idioma — fixar o browser em
    // português evita que dependam do valor por omissão de `navigator.language`
    // do ambiente jsdom ('en-US'), que faria `language` divergir de
    // DEFAULT_SETTINGS.language ('pt') nas comparações abaixo.
    vi.stubGlobal('navigator', { language: 'pt-PT' });
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
    saveSettings({ ...DEFAULT_SETTINGS, boardTheme: 'neon', backgroundTheme: 'dojo' });
    expect(loadSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      boardTheme: 'neon',
      backgroundTheme: 'dojo',
    });
  });

  it('falls back to default theme choices when saved values are invalid', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, boardTheme: 'nao-existe', backgroundTheme: 42 })
    );
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('falls back to the default background when a saved value was retired ("classico"/"noturno")', () => {
    // Regressão: Clássico/Noturno existiram como backgroundTheme válidos e
    // foram removidos (poucas opções cabiam sem scroll lateral em
    // /opções) — alguém com um destes já guardado não pode ficar com um
    // valor "fantasma" que rebenta BACKGROUND_THEMES[...].
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, backgroundTheme: 'classico' })
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

describe('loadSettings — language', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('deteta e grava o idioma quando não há nada guardado', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    const settings = loadSettings();
    expect(settings.language).toBe('en');
    // gravou logo, para não voltar a detetar no próximo load
    const saved = JSON.parse(window.localStorage.getItem('xadrez-settings')!);
    expect(saved.language).toBe('en');
  });

  it('deteta português quando o browser pede português', () => {
    vi.stubGlobal('navigator', { language: 'pt-PT' });
    expect(loadSettings().language).toBe('pt');
  });

  it('usa o idioma guardado sem voltar a detetar', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'en' }));
    vi.stubGlobal('navigator', { language: 'pt-PT' }); // deteção diria 'pt' — não deve ser usada
    expect(loadSettings().language).toBe('en');
  });

  it('trata um idioma guardado inválido como se estivesse em falta', () => {
    window.localStorage.setItem('xadrez-settings', JSON.stringify({ language: 'fr' }));
    vi.stubGlobal('navigator', { language: 'pt-PT' });
    expect(loadSettings().language).toBe('pt');
  });

  it('DEFAULT_SETTINGS.language é "pt"', () => {
    expect(DEFAULT_SETTINGS.language).toBe('pt');
  });

  it('deteta o idioma numa instalação anterior a esta feature, preservando os outros campos já guardados', () => {
    // Formato realista de uma instalação antiga: outros campos gravados,
    // mas sem a chave `language` (não existia antes desta feature).
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ defaultDifficulty: 'dificil', pieceStyle: 'anime' })
    );
    vi.stubGlobal('navigator', { language: 'pt-PT' });

    const settings = loadSettings();
    expect(settings.language).toBe('pt');
    expect(settings.defaultDifficulty).toBe('dificil');
    expect(settings.pieceStyle).toBe('anime');

    // A gravação que a deteção despoleta não pode perder os outros campos
    // já guardados — só a chave `language` estava em falta.
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(saved.language).toBe('pt');
    expect(saved.defaultDifficulty).toBe('dificil');
    expect(saved.pieceStyle).toBe('anime');
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
