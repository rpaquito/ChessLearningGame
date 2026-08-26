import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';

export type BoardTheme = 'sakura' | 'nebulosa' | 'neon';
export type BackgroundTheme = 'classico' | 'noturno';
export type PieceStyle = 'classico' | 'moderno' | 'anime';

export interface Settings {
  defaultDifficulty: Difficulty;
  defaultColor: PlayerColor;
  boardTheme: BoardTheme;
  backgroundTheme: BackgroundTheme;
  pieceStyle: PieceStyle;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultDifficulty: 'facil',
  defaultColor: 'white',
  boardTheme: 'nebulosa',
  backgroundTheme: 'classico',
  pieceStyle: 'anime',
};

const STORAGE_KEY = 'xadrez-settings';

const VALID_DIFFICULTIES: readonly Difficulty[] = ['facil', 'medio', 'dificil'];
const VALID_COLORS: readonly PlayerColor[] = ['white', 'black', 'random'];
const VALID_BOARD_THEMES: readonly BoardTheme[] = ['sakura', 'nebulosa', 'neon'];
const VALID_BACKGROUND_THEMES: readonly BackgroundTheme[] = ['classico', 'noturno'];
const VALID_PIECE_STYLES: readonly PieceStyle[] = ['classico', 'moderno', 'anime'];

/** Valida um valor guardado contra a lista de valores válidos de um campo,
 * devolvendo-o (com o tipo estreitado) só se corresponder a um deles. */
function pickValid<T extends string>(value: unknown, valid: readonly T[], fallback: T): T {
  return typeof value === 'string' && (valid as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * Lê as definições guardadas em localStorage. Dados em falta, corrompidos,
 * ou de um formato antigo caem nos valores por omissão campo a campo — uma
 * só definição inválida não deve rebentar a app inteira nem apagar as
 * outras definições ainda válidas.
 */
export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS;
    const candidate = parsed as Record<string, unknown>;
    return {
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
    };
  } catch {
    return DEFAULT_SETTINGS;
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
