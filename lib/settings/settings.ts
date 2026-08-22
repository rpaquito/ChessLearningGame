import type { Difficulty } from '@/lib/chess/difficulty';
import type { PlayerColor } from '@/lib/chess/playerColor';

export interface Settings {
  defaultDifficulty: Difficulty;
  defaultColor: PlayerColor;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultDifficulty: 'facil',
  defaultColor: 'white',
};

const STORAGE_KEY = 'xadrez-settings';

const VALID_DIFFICULTIES: readonly Difficulty[] = ['facil', 'medio', 'dificil'];
const VALID_COLORS: readonly PlayerColor[] = ['white', 'black', 'random'];

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (VALID_DIFFICULTIES as readonly string[]).includes(value);
}

function isPlayerColor(value: unknown): value is PlayerColor {
  return typeof value === 'string' && (VALID_COLORS as readonly string[]).includes(value);
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
      defaultDifficulty: isDifficulty(candidate.defaultDifficulty)
        ? candidate.defaultDifficulty
        : DEFAULT_SETTINGS.defaultDifficulty,
      defaultColor: isPlayerColor(candidate.defaultColor)
        ? candidate.defaultColor
        : DEFAULT_SETTINGS.defaultColor,
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
