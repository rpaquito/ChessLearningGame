import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';
import type { Locale } from '@/lib/i18n/types';
import { VALID_LOCALES } from '@/lib/i18n/types';
import { detectLocale } from '@/lib/i18n/detectLocale';

export type { Locale }; // re-exportado para quem já importa tipos daqui

export type BoardTheme = 'sakura' | 'nebulosa' | 'neon';
export type BackgroundTheme = 'templo' | 'dojo' | 'cosmico';
export type PieceStyle = 'classico' | 'moderno' | 'anime';

export interface Settings {
  defaultDifficulty: Difficulty;
  defaultColor: PlayerColor;
  boardTheme: BoardTheme;
  backgroundTheme: BackgroundTheme;
  pieceStyle: PieceStyle;
  language: Locale;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultDifficulty: 'facil',
  defaultColor: 'white',
  boardTheme: 'nebulosa',
  backgroundTheme: 'templo',
  pieceStyle: 'anime',
  language: 'pt',
};

const STORAGE_KEY = 'xadrez-settings';

const VALID_DIFFICULTIES: readonly Difficulty[] = ['facil', 'medio', 'dificil'];
const VALID_COLORS: readonly PlayerColor[] = ['white', 'black', 'random'];
const VALID_BOARD_THEMES: readonly BoardTheme[] = ['sakura', 'nebulosa', 'neon'];
const VALID_BACKGROUND_THEMES: readonly BackgroundTheme[] = ['templo', 'dojo', 'cosmico'];
const VALID_PIECE_STYLES: readonly PieceStyle[] = ['classico', 'moderno', 'anime'];

/** Valida um valor guardado contra a lista de valores válidos de um campo,
 * devolvendo-o (com o tipo estreitado) só se corresponder a um deles. */
function pickValid<T extends string>(value: unknown, valid: readonly T[], fallback: T): T {
  return typeof value === 'string' && (valid as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function isValidLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (VALID_LOCALES as readonly string[]).includes(value);
}

function resolveInitialLocale(): Locale {
  return detectLocale(typeof navigator !== 'undefined' ? navigator.language : undefined);
}

/**
 * Lê as definições guardadas em localStorage. Dados em falta, corrompidos,
 * ou de um formato antigo caem nos valores por omissão campo a campo — uma
 * só definição inválida não deve rebentar a app inteira nem apagar as
 * outras definições ainda válidas.
 *
 * `language` tem uma regra diferente dos outros campos: em vez de só cair
 * em DEFAULT_SETTINGS.language quando falta/é inválido, deteta o idioma do
 * browser e GRAVA o resultado logo — para a deteção só acontecer uma vez
 * (visitante novo OU instalação anterior a esta feature, sem a chave
 * `language`). Pequena impureza deliberada numa função hoje só-leitura.
 */
export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const candidate: Record<string, unknown> =
      typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};

    const languageWasStored = isValidLocale(candidate.language);
    const language = languageWasStored ? (candidate.language as Locale) : resolveInitialLocale();

    const result: Settings = {
      defaultDifficulty: pickValid(
        candidate.defaultDifficulty,
        VALID_DIFFICULTIES,
        DEFAULT_SETTINGS.defaultDifficulty
      ),
      defaultColor: pickValid(candidate.defaultColor, VALID_COLORS, DEFAULT_SETTINGS.defaultColor),
      boardTheme: pickValid(candidate.boardTheme, VALID_BOARD_THEMES, DEFAULT_SETTINGS.boardTheme),
      backgroundTheme: pickValid(
        candidate.backgroundTheme,
        VALID_BACKGROUND_THEMES,
        DEFAULT_SETTINGS.backgroundTheme
      ),
      pieceStyle: pickValid(candidate.pieceStyle, VALID_PIECE_STYLES, DEFAULT_SETTINGS.pieceStyle),
      language,
    };

    // Só grava se a deteção correu agora (idioma não vinha guardado) — não
    // queremos escrever em cada load quando já havia um valor válido.
    if (!languageWasStored) saveSettings(result);

    return result;
  } catch {
    return { ...DEFAULT_SETTINGS, language: resolveInitialLocale() };
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage indisponível (modo privado, quota cheia) — as escolhas
    // simplesmente não persistem entre visitas, mas nada na app quebra.
  }
}
